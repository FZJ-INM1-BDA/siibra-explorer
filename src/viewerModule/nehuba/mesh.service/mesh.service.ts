import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { IMeshesToLoad } from '../constants'
import { selectorAuxMeshes } from "../store";
import { SAPI } from "src/atlasComponents/sapi";
import { fromRootStore as nehubaConfigSvcFromRootStore } from "../config.service";
import { atlasSelection } from "src/state";

interface IRegion {
  ngId?: string
  labelIndex?: number
  children: IRegion[]
}


/**
 * control mesh loading etc
 */

@Injectable()
export class NehubaMeshService implements OnDestroy {

  private onDestroyCb: (() => void)[] = []

  constructor(
    private store$: Store<any>,
    private sapiSvc: SAPI
  ){
  }

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  private allRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedParcAllRegions),
  )

  private selectedRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )


  private auxMeshes$ = this.store$.pipe(
    select(selectorAuxMeshes),
  )

  private ngLayers$ = this.store$.pipe(
    nehubaConfigSvcFromRootStore.getNgLayers(this.store$, this.sapiSvc)
  )

  public loadMeshes$: Observable<IMeshesToLoad> = this.ngLayers$.pipe(
    switchMap(ngLayers => {
      const arr: IMeshesToLoad[] = []
      const { parcNgLayers, tmplAuxNgLayers, tmplNgLayers } = ngLayers
      for (const ngId in tmplAuxNgLayers) {
        const meshToLoad: IMeshesToLoad = {
          labelIndicies: [],
          layer: { name: ngId }
        }
        for (const auxMesh of tmplAuxNgLayers[ngId].auxMeshes) {
          meshToLoad.labelIndicies.push(...auxMesh.labelIndicies)
        }
        arr.push(meshToLoad)
      }

      for (const ngId in parcNgLayers) {
        const {labelIndicies} = parcNgLayers[ngId]
        arr.push({
          labelIndicies,
          layer: { name: ngId }
        })
      }

      return of(...arr)
    })
  )
}
