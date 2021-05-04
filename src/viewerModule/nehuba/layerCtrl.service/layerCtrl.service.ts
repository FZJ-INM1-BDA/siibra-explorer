import { Injectable } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, merge, Observable, Subject } from "rxjs";
import { filter, map, shareReplay, tap } from "rxjs/operators";
import { viewerStateSelectedParcellationSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { getRgb, IColorMap } from "./layerCtrl.util";
import { getMultiNgIdsRegionsLabelIndexMap } from "../constants";
import { IAuxMesh } from '../store'

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
export class NehubaLayerControlService {

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

  constructor(
    private store$: Store<any>,
  ){

  }

  public activeColorMap: IColorMap

  public overwriteColorMap$ = new BehaviorSubject<IColorMap>(null)

  public setColorMap$: Observable<IColorMap> = merge(
    this.activeColorMap$,
    this.overwriteColorMap$.pipe(
      filter(v => !!v)
    )
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
