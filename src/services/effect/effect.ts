import { Injectable, OnDestroy } from "@angular/core";
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Subscription, merge, fromEvent, combineLatest, Observable } from "rxjs";
import { withLatestFrom, map, filter, shareReplay, tap, switchMap, take } from "rxjs/operators";
import { Store, select } from "@ngrx/store";
import { SELECT_PARCELLATION, SELECT_REGIONS, NEWVIEWER, UPDATE_PARCELLATION, SELECT_REGIONS_WITH_ID, DESELECT_REGIONS, ADD_TO_REGIONS_SELECTION_WITH_IDS } from "../state/viewerState.store";
import { worker } from 'src/atlasViewer/atlasViewer.workerService.service'
import { getNgIdLabelIndexFromId, generateLabelIndexId, recursiveFindRegionWithLabelIndexId } from '../stateStore.service';

@Injectable({
  providedIn: 'root'
})
export class UseEffects implements OnDestroy{

  constructor(
    private actions$: Actions,
    private store$: Store<any>
  ){
    this.subscriptions.push(
      this.newParcellationSelected$.subscribe(parcellation => {
        worker.postMessage({
          type: `PROPAGATE_NG_ID`,
          parcellation
        })
      })
    )

    this.regionsSelected$ = this.store$.pipe(
      select('viewerState'),
      select('regionsSelected'),
      shareReplay(1)
    )

    this.onDeselectRegions = this.actions$.pipe(
      ofType(DESELECT_REGIONS),
      withLatestFrom(this.regionsSelected$),
      map(([action, regionsSelected]) => {
        const { deselectRegions } = action
        const selectRegions = regionsSelected.filter(r => {
          return !(deselectRegions as any[]).find(dr => compareRegions(dr, r))
        })
        return {
          type: SELECT_REGIONS,
          selectRegions
        }
      })
    )

    this.onDeselectRegionsWithId$ = this.actions$.pipe(
      ofType(ACTION_TYPES.DESELECT_REGIONS_WITH_ID),
      map(action => {
        const { deselecRegionIds } = action as any
        return deselecRegionIds
      }),
      withLatestFrom(this.regionsSelected$),
      map(([ deselecRegionIds, alreadySelectedRegions ]) => {
        const deselectSet = new Set(deselecRegionIds)
        return {
          type: SELECT_REGIONS,
          selectRegions: alreadySelectedRegions.filter(({ ngId, labelIndex }) => !deselectSet.has(generateLabelIndexId({ ngId, labelIndex })))
        }
      })
    )

    this.addToSelectedRegions$ = this.actions$.pipe(
      ofType(ADD_TO_REGIONS_SELECTION_WITH_IDS),
      map(action => {
        const { selectRegionIds } = action
        return selectRegionIds
      }),
      switchMap(selectRegionIds => this.updatedParcellation$.pipe(
        filter(p => !!p),
        take(1),
        map(p => [selectRegionIds, p])
      )),
      map(this.convertRegionIdsToRegion),
      withLatestFrom(this.regionsSelected$),
      map(([ selectedRegions, alreadySelectedRegions ]) => {
        return {
          type: SELECT_REGIONS,
          selectRegions: this.removeDuplicatedRegions(selectedRegions, alreadySelectedRegions)
        }
      })
    )
  }

  private regionsSelected$: Observable<any[]>

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  private subscriptions: Subscription[] = []


  private parcellationSelected$ = this.actions$.pipe(
    ofType(SELECT_PARCELLATION),
  )

  private newViewer$ = this.actions$.pipe(
    ofType(NEWVIEWER)
  )

  private newParcellationSelected$ = merge(
    this.newViewer$,
    this.parcellationSelected$
  ).pipe(
    map(({selectParcellation}) => selectParcellation)
  )

  private updatedParcellation$ = this.store$.pipe(
    select('viewerState'),
    select('parcellationSelected'),
    map(p => p.updated ? p : null),
    shareReplay(1)
  )

  @Effect()
  onDeselectRegions: Observable<any> 

  @Effect()
  onDeselectRegionsWithId$: Observable<any>

  private convertRegionIdsToRegion = ([selectRegionIds, parcellation]) => {
    const { ngId: defaultNgId } = parcellation
    return (<any[]>selectRegionIds)
      .map(labelIndexId => getNgIdLabelIndexFromId({ labelIndexId }))
      .map(({ ngId, labelIndex }) => {
        return {
          labelIndexId: generateLabelIndexId({
            ngId: ngId || defaultNgId,
            labelIndex 
          })
        }
      })
      .map(({ labelIndexId }) => {
        return recursiveFindRegionWithLabelIndexId({ 
          regions: parcellation.regions,
          labelIndexId,
          inheritedNgId: defaultNgId
        })
      })
      .filter(v => {
        if (!v) {
          console.log(`SELECT_REGIONS_WITH_ID, some ids cannot be parsed intto label index`)
        }
        return !!v
      })
  }

  private removeDuplicatedRegions = (...args) => {
    const set = new Set()
    const returnArr = []
    for (const regions of args){
      for (const region of regions){
        if (!set.has(region.name)) {
          returnArr.push(region)
          set.add(region.name)
        }
      }
    }
    return returnArr
  }

  @Effect()
  addToSelectedRegions$: Observable<any>
  

  /**
   * for backwards compatibility.
   * older versions of atlas viewer may only have labelIndex as region identifier
   */
  @Effect()
  onSelectRegionWithId = this.actions$.pipe(
    ofType(SELECT_REGIONS_WITH_ID),
    map(action => {
      const { selectRegionIds } = action
      return selectRegionIds
    }),
    switchMap(selectRegionIds => this.updatedParcellation$.pipe(
      filter(p => !!p),
      take(1),
      map(parcellation => [selectRegionIds, parcellation])
    )),
    map(this.convertRegionIdsToRegion),
    map(selectRegions => {
      return {
        type: SELECT_REGIONS,
        selectRegions
      }
    })
  )

  /**
   * side effect of selecting a parcellation means deselecting all regions
   */
  @Effect()
  onParcellationSelected$ = this.newParcellationSelected$.pipe(
    map(() => ({
      type: SELECT_REGIONS,
      selectRegions: []
    }))
  )

  /**
   * calculating propagating ngId from worker thread
   */
  @Effect()
  updateParcellation$ = fromEvent(worker, 'message').pipe(
    filter((message: MessageEvent) => message && message.data && message.data.type === 'UPDATE_PARCELLATION_REGIONS'),
    map(({data}) => data.parcellation),
    withLatestFrom(this.newParcellationSelected$),
    filter(([ propagatedP, selectedP ] : [any, any]) => {
      /**
       * TODO 
       * use id
       * but jubrain may have same id for different template spaces
       */
      return propagatedP.name === selectedP.name
    }),
    map(([ propagatedP, _ ]) => propagatedP),
    map(parcellation => ({
      type: UPDATE_PARCELLATION,
      updatedParcellation: parcellation
    }))
  )
}

export const compareRegions: (r1: any,r2: any) => boolean = (r1, r2) => {
  if (!r1) return !r2
  if (!r2) return !r1
  return r1.ngId === r2.ngId
    && r1.labelIndex === r2.labelIndex
    && r1.name === r2.name
}

const ACTION_TYPES = {
  DESELECT_REGIONS_WITH_ID: 'DESELECT_REGIONS_WITH_ID'
}

export const VIEWER_STATE_ACTION_TYPES = ACTION_TYPES