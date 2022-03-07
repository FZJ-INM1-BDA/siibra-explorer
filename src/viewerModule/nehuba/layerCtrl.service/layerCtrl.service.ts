import { Inject, Injectable, OnDestroy, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, from, merge, NEVER, Observable, of, Subject, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, mapTo, shareReplay, startWith, switchMap, withLatestFrom } from "rxjs/operators";
import { viewerStateCustomLandmarkSelector, viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { getRgb, IColorMap, INgLayerCtrl, INgLayerInterface, TNgLayerCtrl } from "./layerCtrl.util";
import { getMultiNgIdsRegionsLabelIndexMap } from "../constants";
import { IAuxMesh } from '../store'
import { REGION_OF_INTEREST } from "src/util/interfaces";
import { TRegionDetail } from "src/util/siibraApiConstants/types";
import { EnumColorMapName } from "src/util/colorMaps";
import { getShader, PMAP_DEFAULT_CONFIG } from "src/util/constants";
import { ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer, ngViewerSelectorClearView, ngViewerSelectorLayers } from "src/services/state/ngViewerState.store.helper";
import { serialiseParcellationRegion } from 'common/util'
import { _PLI_VOLUME_INJ_TOKEN, _TPLIVal } from "src/glue";
import { RouterService } from "src/routerModule/router.service";

export const BACKUP_COLOR = {
  red: 255,
  green: 255,
  blue: 255
}

export function getAuxMeshesAndReturnIColor(auxMeshes: IAuxMesh[]): IColorMap{
  const returnVal: IColorMap = {}
  for (const auxMesh of auxMeshes as IAuxMesh[]) {
    const { ngId, labelIndicies, rgb = [255, 255, 255] } = auxMesh
    const auxMeshColorMap = returnVal[ngId] || {}
    for (const lblIdx of labelIndicies) {
      auxMeshColorMap[lblIdx as number] = {
        red: rgb[0] as number,
        green: rgb[1] as number,
        blue: rgb[2] as number,
      }
    }
    returnVal[ngId] = auxMeshColorMap
  }
  return returnVal
}

@Injectable({
  providedIn: 'root'
})
export class NehubaLayerControlService implements OnDestroy{

  static PMAP_LAYER_NAME = 'regional-pmap'

  private selectedRegion$ = this.store$.pipe(
    select(viewerStateSelectedRegionsSelector),
    shareReplay(1),
  )

  private selectedParcellation$ = this.store$.pipe(
    select(viewerStateSelectedParcellationSelector)
  )

  private selectedTemplateSelector$ = this.store$.pipe(
    select(viewerStateSelectedTemplateSelector)
  )

  private selParcNgIdMap$ = this.selectedParcellation$.pipe(
    map(parc => getMultiNgIdsRegionsLabelIndexMap(parc)),
    shareReplay(1),
  )
  
  private activeColorMap$: Observable<IColorMap> = combineLatest([
    this.selParcNgIdMap$.pipe(
      map(map => {
        const returnVal: IColorMap = {}
        for (const [ key, val ] of map.entries()) {
          returnVal[key] = {}
          for (const [ lblIdx, region ] of val.entries()) {
            const rgb = getRgb(lblIdx, region)
            returnVal[key][lblIdx] = rgb
          }
        }
        return returnVal
      })
    ),
    this.selectedRegion$,
    this.selectedTemplateSelector$.pipe(
      map(template => {
        const { auxMeshes = [] } = template || {}
        return getAuxMeshesAndReturnIColor(auxMeshes)
      })
    ),
    this.selectedParcellation$.pipe(
      map(parc => {
        const { auxMeshes = [] } = parc || {}
        return getAuxMeshesAndReturnIColor(auxMeshes)
      })
    ),
  ]).pipe(
    map(([ regions, selReg, ...auxMeshesArr ]) => {
      
      const returnVal: IColorMap = {}
      if (selReg.length === 0) {
        for (const key in regions) {
          returnVal[key] = regions[key]
        }
      } else {
        /**
         * if selected regions are non empty
         * set the selected regions to show color,
         * but the rest to show white 
         */
        for (const key in regions) {
          const colorMap = {}
          returnVal[key] = colorMap
          for (const lblIdx in regions[key]) {
            if (selReg.some(r => r.ngId === key && r.labelIndex === Number(lblIdx))) {
              colorMap[lblIdx] = regions[key][lblIdx]
            } else {
              colorMap[lblIdx] = BACKUP_COLOR
            }
          }
        }
      }

      for (const auxMeshes of auxMeshesArr) {
        for (const key in auxMeshes) {
          const existingObj = returnVal[key] || {}
          returnVal[key] = {
            ...existingObj,
            ...auxMeshes[key],
          }
        }
      }
      this.activeColorMap = returnVal
      return returnVal
    })
  )

  private auxMeshes$: Observable<IAuxMesh[]> = combineLatest([
    this.selectedTemplateSelector$,
    this.selectedParcellation$,
  ]).pipe(
    map(([ tmpl, parc ]) => {
      const { auxMeshes: tmplAuxMeshes = [] as IAuxMesh[] } = tmpl || {}
      const { auxMeshes: parclAuxMeshes = [] as IAuxMesh[] } = parc || {}
      return [...tmplAuxMeshes, ...parclAuxMeshes]
    })
  )

  private sub: Subscription[] = []

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  private pliVol$: Observable<string[]> = this._pliVol$
    ? this._pliVol$.pipe(
      map(arr => {
        const output = []
        for (const item of arr) {
          for (const volume of item.data["iav-registered-volumes"].volumes) {
            output.push(volume.name)
          }
        }
        return output
      })
    )
    : NEVER
  constructor(
    private store$: Store<any>,
    private routerSvc: RouterService,
    @Optional() @Inject(_PLI_VOLUME_INJ_TOKEN) private _pliVol$: Observable<_TPLIVal[]>,
    @Optional() @Inject(REGION_OF_INTEREST) roi$: Observable<TRegionDetail>
  ){

    if (roi$) {

      this.sub.push(
        roi$.pipe(
          switchMap(roi => {
            if (!roi || !roi.hasRegionalMap) {
              // clear pmap
              return of(null)
            }
            
            const { links } = roi
            const { regional_map: regionalMapUrl, regional_map_info: regionalMapInfoUrl } = links
            return from(fetch(regionalMapInfoUrl).then(res => res.json())).pipe(
              map(regionalMapInfo => {
                return {
                  roi,
                  regionalMapUrl,
                  regionalMapInfo
                }
              })
            )
          })
        ).subscribe(processedRoi => {
          if (!processedRoi) {
            this.store$.dispatch(
              ngViewerActionRemoveNgLayer({
                layer: {
                  name: NehubaLayerControlService.PMAP_LAYER_NAME
                }
              })
            )
            return
          }
          const { 
            roi,
            regionalMapUrl,
            regionalMapInfo
          } = processedRoi
          const { min, max, colormap = EnumColorMapName.VIRIDIS } = regionalMapInfo || {} as any

          const shaderObj = {
            ...PMAP_DEFAULT_CONFIG,
            ...{ colormap },
            ...( typeof min !== 'undefined' ? { lowThreshold: min } : {} ),
            ...( max ? { highThreshold: max } : { highThreshold: 1 } )
          }

          const layer = {
            name: NehubaLayerControlService.PMAP_LAYER_NAME,
            source : `nifti://${regionalMapUrl}`,
            mixability : 'nonmixable',
            shader : getShader(shaderObj),
          }

          this.store$.dispatch(
            ngViewerActionAddNgLayer({ layer })
          )

          // this.layersService.highThresholdMap.set(layerName, highThreshold)
          // this.layersService.lowThresholdMap.set(layerName, lowThreshold)
          // this.layersService.colorMapMap.set(layerName, cmap)
          // this.layersService.removeBgMap.set(layerName, removeBg)
        })
      )
    }

    this.sub.push(
      this.ngLayers$.subscribe(({ ngLayers }) => {
        this.ngLayersRegister.layers = ngLayers
      })
    )

    this.sub.push(
      this.store$.pipe(
        select(ngViewerSelectorClearView),
        distinctUntilChanged()
      ).subscribe(flag => {
        const pmapLayer = this.ngLayersRegister.layers.find(l => l.name === NehubaLayerControlService.PMAP_LAYER_NAME)
        if (!pmapLayer) return
        const payload = {
          type: 'update',
          payload: {
            [NehubaLayerControlService.PMAP_LAYER_NAME]: {
              visible: !flag
            }
          }
        } as TNgLayerCtrl<'update'>
        this.manualNgLayersControl$.next(payload)
      })
    )

    /**
     * on custom landmarks loaded, set mesh transparency
     */
    this.sub.push(
      this.store$.pipe(
        select(viewerStateCustomLandmarkSelector),
        withLatestFrom(this.auxMeshes$)
      ).subscribe(([landmarks, auxMeshes]) => {
        
        const payload: {
          [key: string]: number
        } = {}
        const alpha = landmarks.length > 0
          ? 0.2
          : 1.0
        for (const auxMesh of auxMeshes) {
          payload[auxMesh.ngId] = alpha
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

  public expectedLayerNames$ = combineLatest([
    this.selectedTemplateSelector$,
    this.auxMeshes$,
    this.selParcNgIdMap$,
  ]).pipe(
    map(([ tmpl, auxMeshes, parcNgIdMap ]) => {
      const ngIdSet = new Set<string>()
      const { ngId } = tmpl
      ngIdSet.add(ngId)
      for (const auxMesh of auxMeshes) {
        const { ngId } = auxMesh
        ngIdSet.add(ngId as string)
      }
      for (const ngId of parcNgIdMap.keys()) {
        ngIdSet.add(ngId)
      }
      return Array.from(ngIdSet)
    })
  )

  public visibleLayer$: Observable<string[]> = combineLatest([
    this.expectedLayerNames$,
    this.pliVol$.pipe(
      startWith([])
    ),
    this.routerSvc.customRoute$.pipe(
      startWith({}),
      map(val => val['x-voi'] === "d71d369a-c401-4d7e-b97a-3fb78eed06c5"
        ? ["1um"]
        : []),
    )
  ]).pipe(
    map(([ expectedLayerNames, layerNames, voiLayers ]) => {
      const ngIdSet = new Set<string>([...layerNames, ...expectedLayerNames, ...voiLayers])
      return Array.from(ngIdSet)
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
    /**
     * if layer contains non mixable layer
     */
    this.store$.pipe(
      select(ngViewerSelectorLayers),
      map(layers => layers.findIndex(l => l.mixability === 'nonmixable') >= 0),
    ),
    /**
     * clearviewqueue, indicating something is controlling colour map
     * show all seg
     */
    this.store$.pipe(
      select(ngViewerSelectorClearView),
      distinctUntilChanged()
    )
  ]).pipe(
    withLatestFrom(this.selectedParcellation$),
    map(([[ regions, nonmixableLayerExists, clearViewFlag ], selParc]) => {
      if (nonmixableLayerExists && !clearViewFlag) {
        return null
      }
      const { ngId: defaultNgId } = selParc || {}
  
      /* selectedregionindexset needs to be updated regardless of forceshowsegment */
      const selectedRegionIndexSet = new Set<string>(regions.map(({ngId = defaultNgId, labelIndex}) => serialiseParcellationRegion({ ngId, labelIndex })))
      if (selectedRegionIndexSet.size > 0 && !clearViewFlag) {
        return [...selectedRegionIndexSet]
      } else {
        return []
      }
    })
  )

  /**
   * ngLayers controller
   */

  private ngLayersRegister: {layers: INgLayerInterface[]} = {
    layers: []
  }
  public removeNgLayers(layerNames: string[]) {
    this.ngLayersRegister.layers
      .filter(layer => layerNames?.findIndex(l => l === layer.name) >= 0)
      .map(l => l.name)
      .forEach(layerName => {
        this.store$.dispatch(ngViewerActionRemoveNgLayer({
          layer: {
            name: layerName
          }
        }))
      })
  }
  public addNgLayer(layers: INgLayerInterface[]){
    this.store$.dispatch(ngViewerActionAddNgLayer({
      layer: layers
    }))
  }
  private ngLayers$ = this.store$.pipe(
    select(ngViewerSelectorLayers),
    map((ngLayers: INgLayerInterface[]) => {
      const newLayers = ngLayers.filter(l => {
        const registeredLayerNames = this.ngLayersRegister.layers.map(l => l.name)
        return !registeredLayerNames.includes(l.name)
      })
      const removeLayers = this.ngLayersRegister.layers.filter(l => {
        const stateLayerNames = ngLayers.map(l => l.name)
        return !stateLayerNames.includes(l.name)
      })
      return { newLayers, removeLayers, ngLayers }
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
        newLayers.forEach(({ name, source, ...rest }) => newLayersObj[name] = {
          ...rest,
          source,
          // source: getProxyUrl(source),
          // ...getProxyOther({source})
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
        const removeLayerNames = removeLayers.map(v => v.name)
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
