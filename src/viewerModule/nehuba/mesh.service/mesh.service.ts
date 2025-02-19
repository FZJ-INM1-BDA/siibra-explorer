import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { IMeshesToLoad } from '../constants'
import { selectorAuxMeshes } from "../store";
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects";
import { atlasSelection } from "src/state";
import { BaseService } from "../base.service/base.service";
import { IDS } from "src/atlasComponents/sapi"

/**
 * control mesh loading etc
 */

@Injectable()
export class NehubaMeshService implements OnDestroy {

  private onDestroyCb: (() => void)[] = []

  constructor(
    private store$: Store<any>,
    private effect: LayerCtrlEffects,
    private baseService: BaseService,
  ){
  }

  ngOnDestroy(): void {
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }


  public auxMeshes$ = this.effect.onATPDebounceNgLayers$.pipe(
    map(({ tmplAuxNgLayers }) => tmplAuxNgLayers),
  )

  #allSegmentMeshes$ = this.baseService.completeNgIdLabelRegionMap$.pipe(
    map(record => {
      const ngIdRecord: Record<string, number[]> = {}

      for (const [ngId, labelToRegion] of Object.entries(record)) {
        for (const [label, ] of Object.entries(labelToRegion)) {
          if (!ngIdRecord[ngId]) {
            ngIdRecord[ngId] = []
          }
          ngIdRecord[ngId].push(Number(label))
        }
      }

      const arr: IMeshesToLoad[] = []

      for (const ngId in ngIdRecord) {
        const labelIndicies = ngIdRecord[ngId]
        arr.push({
          labelIndicies,
          layer: { name: ngId }
        })
      }

      return arr
    })
  )

  #selectedSegmentMeshes$ = combineLatest([
    this.baseService.completeNgIdLabelRegionMap$,
    this.store$.pipe(
      select(atlasSelection.selectors.selectedRegions),
    ),
  ]).pipe(
    switchMap(([record, selectedRegions]) => {
      const ngIdRecord: Record<string, number[]> = {}
      
      const selectedRegionNameSet = new Set(selectedRegions.map(r => r.name))

      for (const [ngId, labelToRegion] of Object.entries(record)) {
        for (const [label, region] of Object.entries(labelToRegion)) {
          if (!ngIdRecord[ngId]) {
            ngIdRecord[ngId] = []
          }
          if (!selectedRegionNameSet.has(region.name)) {
            continue
          }
          ngIdRecord[ngId].push(Number(label))
        }
      }

      const arr: IMeshesToLoad[] = []

      for (const ngId in ngIdRecord) {
        const labelIndicies = ngIdRecord[ngId]
        arr.push({
          labelIndicies,
          layer: { name: ngId }
        })
      }

      return of(arr)
    })
  )

  #auxMesh$ = this.store$.pipe(
    select(selectorAuxMeshes),
    switchMap(auxMeshes => {
      const obj: Record<string, number[]> = {}
      const arr: IMeshesToLoad[] = []
      for (const mesh of auxMeshes) {
        if (!obj[mesh.ngId]) {
          obj[mesh.ngId] = []
        }
        if (mesh.visible) {
          obj[mesh.ngId].push(...mesh.labelIndicies)
        }
      }
      for (const key in obj) {
        arr.push({
          layer: {
            name: key
          },
          labelIndicies: obj[key]
        })
      }
      return of(arr)
    })
  )

  public loadMeshes$: Observable<IMeshesToLoad> = combineLatest([
    this.#allSegmentMeshes$,
    this.#selectedSegmentMeshes$,
    this.#auxMesh$,
    this.store$.pipe(
      select(atlasSelection.selectors.selectedTemplate)
    ),
    this.store$.pipe(
      select(atlasSelection.selectors.selectedParcellation)
    )
  ]).pipe(
    switchMap(([ allSegMesh, selectedSegMesh, auxmesh, selectedTemplate, selectedParcellation ]) => {
      /**
       * TODO monkey patching jba29 in colin to show all meshes
       * 
       */
      if ((selectedParcellation.id === IDS.PARCELLATION.JBA29 || IDS.PARCELLATION.JBA30 === selectedParcellation.id) && selectedTemplate.id === IDS.TEMPLATES.COLIN27) {
        return of(...allSegMesh)
      }
      const hasSegSelected = selectedSegMesh.some(v => v.labelIndicies.length !== 0)
      const hasAuxMesh = auxmesh.length > 0
      const meshesToLoad: IMeshesToLoad[] = []
      if (!hasSegSelected) {
        meshesToLoad.push(
          ...(hasAuxMesh ? selectedSegMesh : allSegMesh),
          ...auxmesh,
        )
      } else {
        meshesToLoad.push(...selectedSegMesh, ...auxmesh)
      }
      return of(...meshesToLoad)
    })
  )
}
