import { Inject, Injectable, OnDestroy, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, from, merge, Observable, of, Subject, Subscription } from "rxjs";
import { filter, map, shareReplay, switchMap, tap } from "rxjs/operators";
import { viewerStateSelectedParcellationSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { getRgb, IColorMap } from "./layerCtrl.util";
import { getMultiNgIdsRegionsLabelIndexMap } from "../constants";
import { IAuxMesh } from '../store'
import { REGION_OF_INTEREST } from "src/util/interfaces";
import { TRegionDetail } from "src/util/siibraApiConstants/types";
import { EnumColorMapName } from "src/util/colorMaps";
import { getShader, PMAP_DEFAULT_CONFIG } from "src/util/constants";
import { ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer } from "src/services/state/ngViewerState.store.helper";

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

@Injectable()
export class NehubaLayerControlService implements OnDestroy{

  static PMAP_LAYER_NAME = 'regional-pmap'

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
    this.selectedTemplateSelector$.pipe(
      map(template => {
        const { auxMeshes = [] } = template
        return getAuxMeshesAndReturnIColor(auxMeshes)
      })
    ),
    this.selectedParcellation$.pipe(
      map(parc => {
        const { auxMeshes = [] } = parc
        return getAuxMeshesAndReturnIColor(auxMeshes)
      })
    ),
  ]).pipe(
    map(([ regions, ...auxMeshesArr ]) => {
      
      const returnVal: IColorMap = {}

      for (const key in regions) {
        returnVal[key] = regions[key]
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
      const { auxMeshes: tmplAuxMeshes = [] as IAuxMesh[] } = tmpl
      const { auxMeshes: parclAuxMeshes = [] as IAuxMesh[] } = parc
      return [...tmplAuxMeshes, ...parclAuxMeshes]
    })
  )

  private sub: Subscription[] = []

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  constructor(
    private store$: Store<any>,
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
  }

  public activeColorMap: IColorMap

  public overwriteColorMap$ = new BehaviorSubject<IColorMap>(null)

  public setColorMap$: Observable<IColorMap> = merge(
    this.activeColorMap$,
    this.overwriteColorMap$.pipe(
      filter(v => !!v),
    )
  ).pipe(
    shareReplay(1)
  )

  public visibleLayer$: Observable<string[]> = combineLatest([
    this.selectedTemplateSelector$,
    this.auxMeshes$,
    this.selParcNgIdMap$
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
}
