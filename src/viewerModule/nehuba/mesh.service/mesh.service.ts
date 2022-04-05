import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, merge, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { IMeshesToLoad } from '../constants'
import { selectorAuxMeshes } from "../store";
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects";
import { atlasSelection } from "src/state";
import { Tree } from "src/components/flatHierarchy/treeView/treeControl"
import { getParcNgId, getRegionLabelIndex } from "../config.service";

/**
 * control mesh loading etc
 */

@Injectable()
export class NehubaMeshService implements OnDestroy {

  private onDestroyCb: (() => void)[] = []

  constructor(
    private store$: Store<any>,
    private effect: LayerCtrlEffects,
  ){
  }

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }


  public auxMeshes$ = this.effect.onATPDebounceNgLayers$.pipe(
    map(({ tmplAuxNgLayers }) => tmplAuxNgLayers)
  )

  public loadMeshes$: Observable<IMeshesToLoad> = merge(
    combineLatest([
      this.store$.pipe(
        atlasSelection.fromRootStore.distinctATP(),
      ),
      this.store$.pipe(
        select(atlasSelection.selectors.selectedParcAllRegions),
      ),
      this.store$.pipe(
        select(atlasSelection.selectors.selectedRegions),
      )
    ]).pipe(
      switchMap(([{ atlas, template, parcellation }, regions, selectedRegions]) => {
        const ngIdRecord: Record<string, number[]> = {}
        if (selectedRegions.length > 0) {
          for (const r of selectedRegions) {
            const ngId = getParcNgId(atlas, template, parcellation, r)
            const regionLabelIndex = getRegionLabelIndex( atlas, template, parcellation, r )
            if (!ngIdRecord[ngId]) {
              ngIdRecord[ngId] = []
            }
            ngIdRecord[ngId].push(regionLabelIndex)
          }
        } else {
          const tree = new Tree(
            regions,
            (c, p) => (c.hasParent || []).some(_p => _p["@id"] === p["@id"])
          )
  
          for (const r of regions) {
            const regionLabelIndex = getRegionLabelIndex( atlas, template, parcellation, r )
            if (!regionLabelIndex) {
              continue
            }
            if (
              tree.someAncestor(r, (anc) => !!getRegionLabelIndex(atlas, template, parcellation, anc))
            ) {
              continue
            }
            const ngId = getParcNgId(atlas, template, parcellation, r)
            if (!ngIdRecord[ngId]) {
              ngIdRecord[ngId] = []
            }
            ngIdRecord[ngId].push(regionLabelIndex)
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
