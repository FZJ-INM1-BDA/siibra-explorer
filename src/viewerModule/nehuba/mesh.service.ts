import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, of } from "rxjs";
import { switchMap } from "rxjs/operators";
import { viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector } from "src/services/state/viewerState/selectors";
import { IMeshesToLoad } from './constants'
import { flattenReducer } from 'common/util'

interface IRegion {
  ngId?: string
  labelIndex?: number
  children: IRegion[]
}

interface IParc {
  ngId?: string
  regions: IRegion[]
}

type TCollatedLayerNameIdx = {
  [key: string]: number[]
}

export function findFirstChildrenWithLabelIndex(region: IRegion): IRegion[]{
  if (region.ngId && region.labelIndex) {
    return [ region ]
  }
  return region.children
    .map(findFirstChildrenWithLabelIndex)
    .reduce(flattenReducer, [])
}

export function collateLayerNameIndicies(regions: IRegion[]){
  const returnObj: TCollatedLayerNameIdx = {}
  for (const r of regions) {
    if (returnObj[r.ngId]) {
      returnObj[r.ngId].push(r.labelIndex)
    } else {
      returnObj[r.ngId] = [r.labelIndex]
    }
  }
  return returnObj
}

export function getLayerNameIndiciesFromParcRs(parc: IParc, rs: IRegion[]): TCollatedLayerNameIdx {

  const arrOfRegions = (rs.length === 0 ? parc.regions : rs)
    .map(findFirstChildrenWithLabelIndex)
    .reduce(flattenReducer, []) as IRegion[]

  return collateLayerNameIndicies(arrOfRegions)
}

/**
 * control mesh loading etc
 */

@Injectable()
export class NehubaMeshService implements OnDestroy {

  private onDestroyCb: (() => void)[] = []

  constructor(
    private store$: Store<any>
  ){

  }

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  private selectedRegions$ = this.store$.pipe(
    select(viewerStateSelectedRegionsSelector)
  )

  private selectedParc$ = this.store$.pipe(
    select(viewerStateSelectedParcellationSelector)
  )

  public loadMeshes$: Observable<IMeshesToLoad> = combineLatest([
    this.selectedParc$,
    this.selectedRegions$,
  ]).pipe(
    switchMap(([parc, selRegions]) => {
      const obj = getLayerNameIndiciesFromParcRs(parc, selRegions)
      const { auxillaryMeshIndices = [] } = parc
      const arr: IMeshesToLoad[] = []
      for (const key in obj) {
        const labelIndicies = Array.from(new Set([...obj[key], ...auxillaryMeshIndices]))
        arr.push({
          layer: {
            name: key
          },
          labelIndicies
        })
      }
      return of(...arr)
    }),
  )
}
