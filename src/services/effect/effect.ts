import { Injectable, OnDestroy } from "@angular/core";
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Subscription, merge, fromEvent, combineLatest, Observable } from "rxjs";
import { withLatestFrom, map, filter, shareReplay } from "rxjs/operators";
import { Store, select } from "@ngrx/store";
import { SELECT_PARCELLATION, SELECT_REGIONS, NEWVIEWER, UPDATE_PARCELLATION, SELECT_REGIONS_WITH_ID, DESELECT_REGIONS } from "../state/viewerState.store";
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
        const deselectSet = new Set((deselectRegions as any[]).map(r => r.name))
        const selectRegions = regionsSelected.filter(r => !deselectSet.has(r.name))
        return {
          type: SELECT_REGIONS,
          selectRegions
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
    filter(p => !!p && !!p.regions)
  )

  @Effect()
  onDeselectRegions: Observable<any> 

  /**
   * for backwards compatibility.
   * older versions of atlas viewer may only have labelIndex as region identifier
   */
  @Effect()
  onSelectRegionWithId = combineLatest(
    this.actions$.pipe(
      ofType(SELECT_REGIONS_WITH_ID)
    ),
    this.updatedParcellation$
  ).pipe(
    map(([action, parcellation]) => {
      const { selectRegionIds } = action
      const { ngId: defaultNgId } = parcellation

      const selectRegions = (<any[]>selectRegionIds)
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
          if (!v) console.log(`SELECT_REGIONS_WITH_ID, some ids cannot be parsed intto label index`)
          return !!v
        })
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
    filter(([ propagatedP, selectedP ] : [any, any]) => propagatedP.name === selectedP.name),
    map(([ propagatedP, _ ]) => propagatedP),
    map(parcellation => ({
      type: UPDATE_PARCELLATION,
      updatedParcellation: parcellation
    }))
  )
}