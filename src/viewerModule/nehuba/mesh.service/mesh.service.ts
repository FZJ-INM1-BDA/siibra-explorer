import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { merge, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { IMeshesToLoad } from '../constants'
import { selectorAuxMeshes } from "../store";
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects";

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

  private ngLayers$ = this.effect.onATPDebounceNgLayers$

  public loadMeshes$: Observable<IMeshesToLoad> = merge(
    this.ngLayers$.pipe(
      switchMap(ngLayers => {
        const arr: IMeshesToLoad[] = []
        const { parcNgLayers } = ngLayers
  
        for (const ngId in parcNgLayers) {
          const {labelIndicies} = parcNgLayers[ngId]
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
