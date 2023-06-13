import { Injectable } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { from, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { NgSegLayerSpec, SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
import { atlasSelection } from "src/state";
import { getParcNgId } from "../config.service";

type NgMapReturnType = {
  region: SxplrRegion
  layer: NgSegLayerSpec
}

@Injectable({
  providedIn: 'root'
})
export class BaseService {

  constructor(private sapi: SAPI, private store$: Store){}
  
  public selectedATP$ = this.store$.pipe(
    atlasSelection.fromRootStore.distinctATP(),
  )

  public selectedATPR$ = this.selectedATP$.pipe(
    switchMap(({ atlas, template, parcellation }) => 
      this.store$.pipe(
        select(atlasSelection.selectors.selectedParcAllRegions),
        map(regions => ({
          atlas, template, parcellation, regions
        })),
      )
    )
  )

  #translatedNgMap = this.selectedATPR$.pipe(
    switchMap(({ atlas, parcellation, regions, template }) =>
      from(this.sapi.getTranslatedLabelledNgMap(parcellation, template)).pipe(
        map(record => {
          
          const regionmap = new Map<string, SxplrRegion>()
          for (const r of regions) {
            regionmap.set(r.name, r)
          }
          const returnVal: Record<string, Record<number, NgMapReturnType>> = {}
          for (const [ /* url */ , { layer, region }] of Object.entries(record)) {
            
            
            for (const { name, label } of region) {
              const actualRegion = regionmap.get(name) || (() => {
                console.log(`region with name ${name} cannot be found. Viewer may not behave properly`)
                return { name, id: '', parentIds: [], type: 'SxplrRegion' }
              })()
              const ngId = getParcNgId(atlas, template, parcellation, actualRegion)
              if (!returnVal[ngId]) {
                returnVal[ngId] = {}
              }
              returnVal[ngId][label] = {
                region: actualRegion,
                layer
              }
            }
          }
          return returnVal
        })
      )
    )
  )

  public completeNgIdLabelRegionMap$: Observable<Record<string, Record<number, SxplrRegion>>> = this.#translatedNgMap.pipe(
    map(val => {
      const returnObj: Record<string, Record<number, SxplrRegion>> = {}
      for (const [ ngId, obj ] of Object.entries(val)) {
        for (const [label, layer] of Object.entries(obj)) {
          if (!returnObj[ngId]) {
            returnObj[ngId] = {}
          }
          returnObj[ngId][label] = layer.region
        }
      }
      return returnObj
    })
  )
}
