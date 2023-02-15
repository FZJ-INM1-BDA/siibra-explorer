import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, merge, Observable, of } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";
import { IMeshesToLoad } from '../constants'
import { selectorAuxMeshes } from "../store";
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects";
import { atlasSelection } from "src/state";
import { Tree } from "src/components/flatHierarchy/treeView/treeControl"
import { BaseService } from "../base.service/base.service";

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
    tap(v => console.log('mesh.service', v))
  )

  public loadMeshes$: Observable<IMeshesToLoad> = merge(
    combineLatest([
      this.baseService.completeNgIdLabelRegionMap$,
      this.store$.pipe(
        select(atlasSelection.selectors.selectedParcAllRegions),
      ),
      this.store$.pipe(
        select(atlasSelection.selectors.selectedRegions),
      ),
      
    ]).pipe(
      switchMap(([record, regions, selectedRegions]) => {
        const ngIdRecord: Record<string, number[]> = {}
        
        const tree = new Tree(
          regions,
          (c, p) => (c.parentIds.some( id => p.id === id))
        )
        
        const selectedRegionFlag = selectedRegions.length > 0
        const selectedRegionNameSet = new Set(selectedRegions.map(r => r.name))

        for (const [ngId, labelToRegion] of Object.entries(record)) {
          for (const [label, region] of Object.entries(labelToRegion)) {
            if (selectedRegionFlag && !selectedRegionNameSet.has(region.name)) {
              continue
            }
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
  
        return of(...arr)
      })
    ),
    this.store$.pipe(
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
        return of(...arr)
      })
    )
  )
}
