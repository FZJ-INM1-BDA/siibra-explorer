import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, merge, Observable, Subject, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, tap, withLatestFrom } from "rxjs/operators";
import { IColorMap, INgLayerCtrl, TNgLayerCtrl } from "./layerCtrl.util";
import { SAPIRegion } from "src/atlasComponents/sapi/core";
import { getParcNgId } from "../config.service"
import { getRegionLabelIndex } from "../config.service/util";
import { annotation, atlasAppearance, atlasSelection } from "src/state";
import { serializeSegment } from "../util";
import { LayerCtrlEffects } from "./layerCtrl.effects";
import { arrayEqual } from "src/util/array";

export const BACKUP_COLOR = {
  red: 255,
  green: 255,
  blue: 255
}

@Injectable({
  providedIn: 'root'
})
export class NehubaLayerControlService implements OnDestroy{

  static PMAP_LAYER_NAME = 'regional-pmap'

  private selectedRegion$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions),
    shareReplay(1),
  )


  private defaultNgLayers$ = this.layerEffects.onATPDebounceNgLayers$

  private selectedATP$ = this.store$.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    shareReplay(1),
  )

  public selectedATPR$ = this.selectedATP$.pipe(
    switchMap(({ atlas, template, parcellation }) => 
      this.store$.pipe(
        select(atlasSelection.selectors.selectedParcAllRegions),
        map(regions => ({
          atlas, template, parcellation, regions
        })),
        shareReplay(1)
      )
    )
  )

  private activeColorMap$ = combineLatest([
    this.selectedATPR$.pipe(
      map(({ atlas, parcellation, regions, template }) => {

        const returnVal: IColorMap = {}
        for (const r of regions) {
          
          if (!r.hasAnnotation) continue
          if (!r.hasAnnotation.visualizedIn) continue

          const ngId = getParcNgId(atlas, template, parcellation, r)
          const [ red, green, blue ] = SAPIRegion.GetDisplayColor(r)
          const labelIndex = getRegionLabelIndex(atlas, template, parcellation, r)
          if (!labelIndex) continue

          if (!returnVal[ngId]) {
            returnVal[ngId] = {}
          }
          returnVal[ngId][labelIndex] = { red, green, blue }
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

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  constructor(
    private store$: Store<any>,
    private layerEffects: LayerCtrlEffects,
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
      this.store$.pipe(
        select(annotation.selectors.annotations),
        withLatestFrom(this.defaultNgLayers$)
      ).subscribe(([landmarks, { tmplAuxNgLayers }]) => {
        const payload: {
          [key: string]: number
        } = {}
        const alpha = landmarks.length > 0
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

  public activeColorMap: IColorMap

  public overwriteColorMap$ = new BehaviorSubject<IColorMap>(null)

  public setColorMap$: Observable<IColorMap> = merge(
    this.activeColorMap$.pipe(
      // TODO this is a dirty fix
      // it seems, sometimes, overwritecolormap and activecolormap can emit at the same time
      // (e.g. when reg selection changes)
      // this ensures that the activecolormap emits later, and thus take effect over overwrite colormap
      debounceTime(16),
    ),
    this.overwriteColorMap$.pipe(
      filter(v => !!v),
    )
  ).pipe(
    shareReplay(1)
  )

  public expectedLayerNames$ = this.defaultNgLayers$.pipe(
    map(({ parcNgLayers, tmplAuxNgLayers, tmplNgLayers }) => {
      return [
        ...Object.keys(parcNgLayers),
        ...Object.keys(tmplAuxNgLayers),
        ...Object.keys(tmplNgLayers),
      ]
    })
  )

  public visibleLayer$: Observable<string[]> = combineLatest([
    this.expectedLayerNames$.pipe(
      map(expectedLayerNames => {
        const ngIdSet = new Set<string>([...expectedLayerNames])
        return Array.from(ngIdSet)
      })
    ),
    this.store$.pipe(
      select(atlasAppearance.selectors.customLayers),
      map(cl => {
        const otherColormapExist = cl.filter(l => l.clType === "customlayer/colormap").length > 0
        const pmapExist = cl.filter(l => l.clType === "customlayer/nglayer").length > 0
        return pmapExist && !otherColormapExist
      }),
      distinctUntilChanged(),
      map(flag => flag
        ? [ NehubaLayerControlService.PMAP_LAYER_NAME ]
        : []
      )
    )
  ]).pipe(
    map(([ expectedLayerNames, pmapLayer ]) => [...expectedLayerNames, ...pmapLayer])
  )

  /**
   * define when shown segments should be updated
   */
  public _segmentVis$: Observable<string[]> = combineLatest([
    this.selectedATP$,
    this.selectedRegion$
  ]).pipe(
    map(() => [''])
  )

  public segmentVis$: Observable<string[]> = combineLatest([
    /**
     * selectedRegions
     */
    this.selectedRegion$,
    /**
     * if layer contains non mixable layer
     */
    this.store$.pipe(
      select(atlasAppearance.selectors.customLayers),
      map(layers => layers.filter(l => l.clType === "customlayer/nglayer").length > 0),
    ),
  ]).pipe(
    withLatestFrom(this.selectedATP$),
    map(([[ regions, nonmixableLayerExists ], { atlas, parcellation, template }]) => {
      if (nonmixableLayerExists) {
        return null
      }
  
      /* selectedregionindexset needs to be updated regardless of forceshowsegment */
      const selectedRegionIndexSet = new Set<string>(
        regions.map(r => {
          const ngId = getParcNgId(atlas, template, parcellation, r)
          const label = getRegionLabelIndex(atlas, template, parcellation, r)
          return serializeSegment(ngId, label)
        })
      )
      if (selectedRegionIndexSet.size > 0) {
        return [...selectedRegionIndexSet]
      } else {
        return []
      }
    })
  )

  /**
   * ngLayers controller
   */

  private ngLayersRegister: atlasAppearance.NgLayerCustomLayer[] = []

  private ngLayers$ = this.store$.pipe(
    select(atlasAppearance.selectors.customLayers),
    map(customLayers => customLayers.filter(l => l.clType === "customlayer/nglayer") as atlasAppearance.NgLayerCustomLayer[]),
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
    this.manualNgLayersControl$,
  ).pipe(
  )
}
