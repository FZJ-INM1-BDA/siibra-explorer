import { Injectable, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Actions, ofType, Effect } from "@ngrx/effects";
import { DATASETS_ACTIONS_TYPES, DataEntry } from "src/services/state/dataStore.store";
import { Observable, of, from, merge, Subscription } from "rxjs";
import { withLatestFrom, map, catchError, filter, switchMap, scan } from "rxjs/operators";
import { KgSingleDatasetService } from "./kgSingleDatasetService.service";
import { getIdFromDataEntry } from "./databrowser.service";
import { LOCAL_STORAGE_CONST } from "src/util/constants";

const savedFav$ = of(window.localStorage.getItem(LOCAL_STORAGE_CONST.FAV_DATASET)).pipe(
  map(string => JSON.parse(string)),
  map(arr => {
    if (arr.every(item => item.id )) return arr
    throw new Error('Not every item has id and/or name defined')
  }),
  catchError(err => {
    /**
     * TODO emit proper error
     * possibly wipe corrupted local stoage here?
     */
    return of(null)
  })
)

@Injectable({
  providedIn: 'root'
})

export class DataBrowserUseEffect implements OnDestroy{

  private subscriptions: Subscription[] = []

  constructor(
    private store$: Store<any>,
    private actions$: Actions<any>,
    private kgSingleDatasetService: KgSingleDatasetService
    
  ){
    this.favDataEntries$ = this.store$.pipe(
      select('dataStore'),
      select('favDataEntries')
    )

    this.toggleDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.TOGGLE_FAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([action, prevFavDataEntries]) => {
        const { payload = {} } = action as any
        const { id } = payload

        const wasFav = prevFavDataEntries.findIndex(ds => ds.id === id) >= 0
        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries: wasFav 
            ? prevFavDataEntries.filter(ds => ds.id !== id)
            : prevFavDataEntries.concat(payload)
        }
      })
    )

    this.unfavDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.UNFAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([action, prevFavDataEntries]) => {

        const { payload = {} } = action as any
        const { id } = payload
        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries: prevFavDataEntries.filter(ds => ds.id !== id)
        }
      })
    )

    this.favDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.FAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([ action, prevFavDataEntries ]) => {
        const { payload } = action as any
    
        /**
         * check duplicate
         */
        const favDataEntries = prevFavDataEntries.find(favDEs => favDEs.id === payload.id)
          ? prevFavDataEntries
          : prevFavDataEntries.concat(payload)
    
        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries
        }
      })
    )


    this.subscriptions.push(
      this.favDataEntries$.pipe(
        filter(v => !!v)
      ).subscribe(favDataEntries => {
        /**
         * only store the minimal data in localstorage/db, hydrate when needed
         * for now, only save id 
         * 
         * do not save anything else on localstorage. This could potentially be leaking sensitive information
         */
        const serialisedFavDataentries = favDataEntries.map(dataentry => {
          const id = getIdFromDataEntry(dataentry)
          return { id }
        })
        window.localStorage.setItem(LOCAL_STORAGE_CONST.FAV_DATASET, JSON.stringify(serialisedFavDataentries))
      })
    )

    this.savedFav$ = savedFav$

    this.onInitGetFav$ = this.savedFav$.pipe(
      filter(v => !!v),
      switchMap(arr => 
        merge(
          ...arr.map(({ id: kgId }) => 
            from( this.kgSingleDatasetService.getInfoFromKg({ kgId })).pipe(
              catchError(err => {
                console.log(`fetchInfoFromKg error`, err)
                return of(null)
              }),
              switchMap(dataset => 
                this.kgSingleDatasetService.datasetHasPreview(dataset).pipe(
                  catchError(err => {
                    console.log(`fetching hasPreview error`, err)
                    return of({})
                  }),
                  map(resp => {
                    return {
                      ...dataset,
                      ...resp
                    }
                  })
                )
              )
            )
          )
        ).pipe(
          filter(v => !!v),
          scan((acc, curr) => acc.concat(curr), [])
        )
      ),
      map(favDataEntries => {
        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries
        }
      })
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  private savedFav$: Observable<{id: string, name: string}[] | null>

  @Effect()
  public onInitGetFav$: Observable<any>

  private favDataEntries$: Observable<DataEntry[]>

  @Effect()
  public favDataset$: Observable<any>

  @Effect()
  public unfavDataset$: Observable<any>

  @Effect()
  public toggleDataset$: Observable<any>
}
