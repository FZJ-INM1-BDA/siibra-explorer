import { Inject, Injectable, OnDestroy, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, merge, Observable, of, Subject, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, pairwise, shareReplay, startWith, switchMap, withLatestFrom } from "rxjs/operators";
import { IColorMap, INgLayerCtrl, TNgLayerCtrl } from "./layerCtrl.util";
import { annotation, atlasAppearance, atlasSelection } from "src/state";
import { serializeSegment } from "../util";
import { LayerCtrlEffects } from "./layerCtrl.effects";
import { arrayEqual } from "src/util/array";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
import { AnnotationLayer } from "src/atlasComponents/annotations";
import { PMAP_LAYER_NAME } from "../constants"
import { getShader } from "src/util/fn";
import { BaseService } from "../base.service/base.service";
import { ParcellationVisibilityService } from "src/atlasComponents/sapiViews/core/parcellation/parcellationVis.service";

export const BACKUP_COLOR = {
  red: 255,
  green: 255,
  blue: 255
}

@Injectable({
  providedIn: 'root'
})
export class NehubaLayerControlService implements OnDestroy{

  private selectedRegion$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions),
    shareReplay(1),
  )


  private defaultNgLayers$ = this.layerEffects.onATPDebounceNgLayers$

  public selectedATPR$ = this.baseService.selectedATPR$

  private customLayers$ = this.store$.pipe(
    select(atlasAppearance.selectors.customLayers),
    distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
    shareReplay(1)
  )
  
  public completeNgIdLabelRegionMap$ = this.baseService.completeNgIdLabelRegionMap$

  private activeColorMap$ = combineLatest([
    combineLatest([
      this.completeNgIdLabelRegionMap$,
      this.customLayers$.pipe(
        map(layers => layers.filter(l => l.clType === "customlayer/colormap") as atlasAppearance.const.ColorMapCustomLayer[]),
        distinctUntilChanged(arrayEqual((o, n) => o.id === n.id))
      ),
      this.customLayers$.pipe(
        map(layers => layers.filter(l => l.clType === "baselayer/colormap") as atlasAppearance.const.ColorMapCustomLayer[]),
        distinctUntilChanged(arrayEqual((o, n) => o.id === n.id))
      ),
      this.selectedRegion$,
    ]).pipe(
      map(([record, cmCustomLayers, cmBaseLayers, selectedRegions]) => {
        const returnVal: IColorMap = {}

        const usingCustomCM = cmCustomLayers.length > 0

        const useCm = (() => {
          /**
           * if custom layer exist, use the last custom layer
           */
          if (cmCustomLayers.length > 0) return cmCustomLayers[cmCustomLayers.length - 1].colormap
          /**
           * otherwise, use last baselayer
           */
          if (cmBaseLayers.length > 0) return cmBaseLayers[cmBaseLayers.length - 1].colormap
          /**
           * fallback color map
           */
          return {
            set: () => {
              throw new Error(`cannot set`)
            },
            get: (r: SxplrRegion) => r.color
          }
        })()

        const selectedRegionNameSet = new Set(selectedRegions.map(v => v.name))
        
        for (const [ngId, labelRecord] of Object.entries(record)) {
          for (const [label, region] of Object.entries(labelRecord)) {
            if (!region.color) continue
            /**
             * if custom color map is used, do *not* selectively paint selected region
             * custom color map can choose to subscribe to selected regions, and update the color map accordingly, 
             * if they wish to respect the selected regions
             */
            const [ red, green, blue ] = usingCustomCM || selectedRegionNameSet.size === 0 || selectedRegionNameSet.has(region.name)
              ? useCm.get(region) || [200, 200, 200]
              : [255, 255, 255]
            if (!returnVal[ngId]) {
              returnVal[ngId] = {}
            }
            returnVal[ngId][label] = { red, green, blue }
          }
        }
        return returnVal
      })
    ),
    this.defaultNgLayers$.pipe(
      map(({ tmplAuxNgLayers }) => {
        const returnVal: IColorMap = {}
        for (const ngId in tmplAuxNgLayers) {
          returnVal[ngId] = {}
          const { auxMeshes } = tmplAuxNgLayers[ngId]
          for (const auxMesh of auxMeshes) {
            const { labelIndicies } = auxMesh
            for (const lblIdx of labelIndicies) {
              returnVal[ngId][lblIdx] = BACKUP_COLOR
            }
          }
        }
        return returnVal
      })
    )
  ]).pipe(
    map(([cmParc, cmAux]) => ({
      ...cmParc,
      ...cmAux
    }))
  )

  private sub: Subscription[] = []

  ngOnDestroy(): void{
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  constructor(
    private store$: Store<any>,
    private layerEffects: LayerCtrlEffects,
    private baseService: BaseService,
    @Optional()
    @Inject(ParcellationVisibilityService)
    private parcVisSvc: ParcellationVisibilityService,
  ){

    this.sub.push(

      /**
       * on store showdelin
       * toggle parcnglayers visibility
       */
      this.store$.pipe(
        select(atlasAppearance.selectors.showDelineation),
        withLatestFrom(this.defaultNgLayers$)
      ).subscribe(([flag, { parcNgLayers }]) => {
        const layerObj = {}
        for (const key in parcNgLayers) {
          layerObj[key] = {
            visible: flag
          }
        }

        this.manualNgLayersControl$.next({
          type: 'update',
          payload: layerObj
        })
      }),
    )

    this.sub.push(
      this.ngLayers$.subscribe(({ customLayers }) => {
        this.ngLayersRegister = customLayers
      })
    )

    /**
     * on custom landmarks loaded, set mesh transparency
     */
    this.sub.push(
      merge(
        this.store$.pipe(
          select(annotation.selectors.annotations),
          map(landmarks => landmarks.length > 0),
        ),
        this.store$.pipe(
          select(atlasAppearance.selectors.customLayers),
          map(customLayers => customLayers.filter(l => l.clType === "customlayer/nglayer" && typeof l.source === "string" && /^swc:\/\//.test(l.source)).length > 0),
        )
      ).pipe(
        startWith(false),
        withLatestFrom(this.defaultNgLayers$)
      ).subscribe(([flag, { tmplAuxNgLayers }]) => {
        const payload: {
          [key: string]: number
        } = {}
        const alpha = flag
          ? 0.2
          : 1.0
        for (const ngId in tmplAuxNgLayers) {
          payload[ngId] = alpha
        }
        
        this.manualNgLayersControl$.next({
          type: 'setLayerTransparency',
          payload
        })
      })
    )
  }

  public setColorMap$: Observable<IColorMap> = this.activeColorMap$.pipe(
    debounceTime(16),
  ).pipe(
    shareReplay(1)
  )

  public expectedVisibleLayerNames$ = combineLatest([
    this.defaultNgLayers$,
    (this.parcVisSvc?.visibility$ || of(true)) 
  ]).pipe(
    map(([{ parcNgLayers, tmplAuxNgLayers, tmplNgLayers }, parcVisible]) => {
      return [
        ...(
          parcVisible
          ? Object.keys(parcNgLayers)
          : []
        ),
        ...Object.keys(tmplAuxNgLayers),
        ...Object.keys(tmplNgLayers),
      ]
    })
  )

  /**
   * define when shown segments should be updated
   */
  public segmentVis$: Observable<string[]> = combineLatest([
    /**
     * selectedRegions
     */
    this.selectedRegion$,
    this.customLayers$.pipe(
      map(layers => layers.filter(l => l.clType === "customlayer/colormap").length > 0),
    ),
    /**
     * if layer contains non mixable layer
     */
    this.customLayers$.pipe(
      map(layers => layers.filter(l => l.clType === "customlayer/nglayer").length > 0),
    ),
  ]).pipe(
    switchMap(( [ selectedRegions, customMapExists, nonmixableLayerExists ] ) => this.completeNgIdLabelRegionMap$.pipe(
      map(completeNgIdLabelRegion => {
        /**
       * if non mixable layer exist (e.g. pmap)
       * and no custom color map exist
       * hide all segmentations
       */
      if (!customMapExists && nonmixableLayerExists) {
        return null
      }
  
      /**
       * if custom map exists, roi is all regions
       * otherwise, roi is only selectedRegions
       */
      const selectedRegionNameSet = new Set(selectedRegions.map(r => r.name))
      const roiIndexSet = new Set<string>()
      for (const ngId in completeNgIdLabelRegion) {
        for (const label in completeNgIdLabelRegion[ngId]) {
          const val = completeNgIdLabelRegion[ngId][label]
          if (!customMapExists && !selectedRegionNameSet.has(val.name)) {
            continue
          }
          roiIndexSet.add(serializeSegment(ngId, label))
        } 
      }
      if (roiIndexSet.size > 0) {
        return [...roiIndexSet]
      } else {
        return []
      }
      }),
    )),
  )

  /**
   * ngLayers controller
   */

  private ngLayersRegister: atlasAppearance.const.NgLayerCustomLayer[] = []

  private getUpdatedCustomLayer(isSameLayer: (o: atlasAppearance.const.NgLayerCustomLayer, n: atlasAppearance.const.NgLayerCustomLayer) => boolean){
    return this.store$.pipe(
      select(atlasAppearance.selectors.customLayers),
      map(customLayers => customLayers.filter(l => l.clType === "customlayer/nglayer") as atlasAppearance.const.NgLayerCustomLayer[]),
      pairwise(),
      map(([ oldCustomLayers, newCustomLayers ]) => {
        return newCustomLayers.filter(n => oldCustomLayers.some(o => o.id === n.id && !isSameLayer(o, n)))
      }),
      filter(arr => arr.length > 0),
    )
  }

  private updateCustomLayerTransparency$ = this.getUpdatedCustomLayer((o, n) => o.opacity === n.opacity)
  private updateCustomLayerColorMap$ = this.getUpdatedCustomLayer((o, n) => o.shader === n.shader)

  private ngLayers$ = this.customLayers$.pipe(
    map(customLayers => customLayers.filter(l => l.clType === "customlayer/nglayer") as atlasAppearance.const.NgLayerCustomLayer[]),
    distinctUntilChanged(
      arrayEqual((o, n) => o.id === n.id)
    ),
    map(customLayers => {
      const newLayers = customLayers.filter(l => {
        const registeredLayerNames = this.ngLayersRegister.map(l => l.id)
        return !registeredLayerNames.includes(l.id)
      })
      const removeLayers = this.ngLayersRegister.filter(l => {
        const stateLayerNames = customLayers.map(l => l.id)
        return !stateLayerNames.includes(l.id)
      })
      return { newLayers, removeLayers, customLayers }
    }),
    shareReplay(1)
  )
  private manualNgLayersControl$ = new Subject<TNgLayerCtrl<keyof INgLayerCtrl>>()
  ngLayersController$: Observable<TNgLayerCtrl<keyof INgLayerCtrl>> = merge(
    this.ngLayers$.pipe(
      map(({ newLayers }) => newLayers),
      filter(layers => layers.length > 0),
      map(newLayers => {

        const newLayersObj: any = {}
        newLayers.forEach(({ id, source, ...rest }) => newLayersObj[id] = {
          ...rest,
          source,
        })
  
        return {
          type: 'add',
          payload: newLayersObj
        } as TNgLayerCtrl<'add'>
      })
    ),
    this.ngLayers$.pipe(
      map(({ removeLayers }) => removeLayers),
      filter(layers => layers.length > 0),
      map(removeLayers => {
        const removeLayerNames = removeLayers.map(v => v.id)
        return {
          type: 'remove',
          payload: { names: removeLayerNames }
        } as TNgLayerCtrl<'remove'>
      })
    ),
    this.updateCustomLayerTransparency$.pipe(
      map(layers => {
        const payload: Record<string, number> = {}
        for (const layer of layers) {
          const opacity = layer.opacity ?? 0.8
          payload[layer.id] = opacity
        }
        return {
          type: 'setLayerTransparency',
          payload
        } as TNgLayerCtrl<'setLayerTransparency'>
      })
    ),
    this.updateCustomLayerColorMap$.pipe(
      map(layers => {
        const payload: Record<string, string> = {}
        for (const layer of layers) {
          const shader = layer.shader ?? getShader()
          payload[layer.id] = shader
        }
        return {
          type: 'updateShader',
          payload
        } as TNgLayerCtrl<'updateShader'>
      })
    ),
    this.manualNgLayersControl$,
  ).pipe(
  )

  public visibleLayer$: Observable<string[]> = combineLatest([
    this.expectedVisibleLayerNames$.pipe(
      map(expectedLayerNames => {
        const ngIdSet = new Set<string>([...expectedLayerNames])
        return Array.from(ngIdSet)
      })
    ),
    this.ngLayers$.pipe(
      map(({ customLayers }) => customLayers),
      startWith([] as atlasAppearance.const.NgLayerCustomLayer[]),
      map(customLayers => {
        /**
         * pmap control has its own visibility controller
         */
        return customLayers
          .map(l => l.id)
          .filter(name => name !== PMAP_LAYER_NAME)
      })
    ),
    this.customLayers$.pipe(
      map(cl => {
        const otherColormapExist = cl.filter(l => l.clType === "customlayer/colormap").length > 0
        const otherLayerNames = cl.filter(l => l.clType === "customlayer/nglayer").map(l => l.id)
        return otherColormapExist
          ? []
          : otherLayerNames
      }),
    )
  ]).pipe(
    map(([ expectedLayerNames, customLayerNames, pmapName ]) => [...expectedLayerNames, ...customLayerNames, ...pmapName, ...AnnotationLayer.Map.keys()])
  )


  static ExternalLayerNames = new Set<string>()

  /**
   * @description Occationally, a layer can be managed by external components. Register the name of such layers so it will be ignored.
   * @param layername 
   */
  static RegisterLayerName(layername: string) {
    NehubaLayerControlService.ExternalLayerNames.add(layername)
  }
  /**
   * @description Once external component is done with the layer, return control back to the service
   * @param layername 
   */
  static DeregisterLayerName(layername: string) {
    NehubaLayerControlService.ExternalLayerNames.delete(layername)
  }
}
