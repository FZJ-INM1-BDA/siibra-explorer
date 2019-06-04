import { Injectable, OnDestroy } from "@angular/core";
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Observable, Subscription, merge, fromEvent } from "rxjs";
import { SHOW_KG_TOS } from "../state/uiState.store";
import { withLatestFrom, map, tap, switchMap, filter } from "rxjs/operators";
import { Store, select } from "@ngrx/store";
import { SELECT_PARCELLATION, SELECT_REGIONS, NEWVIEWER, UPDATE_PARCELLATION } from "../state/viewerState.store";
import { worker } from 'src/atlasViewer/atlasViewer.workerService.service'

@Injectable({
  providedIn: 'root'
})
export class UseEffects implements OnDestroy{

  constructor(
    private actions$: Actions
  ){
    this.subscriptions.push(
      this.newParcellationSelected$.subscribe(parcellation => {
        worker.postMessage({
          type: `PROPAGATE_NG_ID`,
          parcellation
        })
      })
    )
  }

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