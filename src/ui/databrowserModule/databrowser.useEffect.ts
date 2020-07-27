import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { filter, map, withLatestFrom, tap } from "rxjs/operators";
import { DATASETS_ACTIONS_TYPES, IDataEntry } from "src/services/state/dataStore.store";
import { LOCAL_STORAGE_CONST } from "src/util/constants";
import { getKgSchemaIdFromFullId } from "./util/getKgSchemaIdFromFullId.pipe";

@Injectable({
  providedIn: 'root',
})

export class DataBrowserUseEffect {

  private subscriptions: Subscription[] = []

  constructor(
    private store$: Store<any>,
    private actions$: Actions<any>,
  ) {

    this.favDataEntries$ = this.store$.pipe(
      select('dataStore'),
      select('favDataEntries'),
    )

    this.toggleDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.TOGGLE_FAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([action, prevFavDataEntries]) => {
        const { payload = {} } = action as any
        const { fullId } = payload

        const re1 = getKgSchemaIdFromFullId(fullId)

        if (!re1) {
          return {
            type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
            favDataEntries: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          }
        }
        const favIdx = prevFavDataEntries.findIndex(ds => {
          const re2 = getKgSchemaIdFromFullId(ds.fullId)
          if (!re2) return false
          return re2[1] === re1[1]
        })
        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries: favIdx >= 0
            ? prevFavDataEntries.filter((_, idx) => idx !== favIdx)
            : prevFavDataEntries.concat(payload),
        }
      }),
    )

    this.unfavDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.UNFAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([action, prevFavDataEntries]) => {

        const { payload = {} } = action as any
        const { fullId } = payload

        const re1 = getKgSchemaIdFromFullId(fullId)

        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries: prevFavDataEntries.filter(ds => {
            const re2 = getKgSchemaIdFromFullId(ds.fullId)
            if (!re2) return false
            if (!re1) return true
            return re2[1] !== re1[1]
          }),
        }
      }),
    )

    this.favDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.FAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([ action, prevFavDataEntries ]) => {
        const { payload } = action as any

        /**
         * check duplicate
         */
        const { fullId } = payload
        const re1 = getKgSchemaIdFromFullId(fullId)
        if (!re1) {
          return {
            type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
            favDataEntries: prevFavDataEntries,
          }
        }

        const isDuplicate = prevFavDataEntries.some(favDe => {
          const re2 = getKgSchemaIdFromFullId(favDe.fullId)
          if (!re2) return false
          return re1[1] === re2[1]
        })
        const favDataEntries = isDuplicate
          ? prevFavDataEntries
          : prevFavDataEntries.concat(payload)

        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries,
        }
      }),
    )

    this.subscriptions.push(
      this.favDataEntries$.pipe(
        filter(v => !!v),
      ).subscribe(favDataEntries => {
        /**
         * only store the minimal data in localstorage/db, hydrate when needed
         * for now, only save id
         *
         * do not save anything else on localstorage. This could potentially be leaking sensitive information
         */
        const serialisedFavDataentries = favDataEntries.map(({ fullId }) => {
          return { fullId }
        })
        window.localStorage.setItem(LOCAL_STORAGE_CONST.FAV_DATASET, JSON.stringify(serialisedFavDataentries))
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  private savedFav$: Observable<Array<{id: string, name: string}> | null>

  private favDataEntries$: Observable<Partial<IDataEntry>[]>

  @Effect()
  public favDataset$: Observable<any>

  @Effect()
  public unfavDataset$: Observable<any>

  @Effect()
  public toggleDataset$: Observable<any>

}
