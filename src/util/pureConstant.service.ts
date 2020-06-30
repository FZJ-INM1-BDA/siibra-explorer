import { Injectable, OnDestroy } from "@angular/core";
import { Store, createSelector, select } from "@ngrx/store";
import { Observable, merge, Subscription } from "rxjs";
import { VIEWER_CONFIG_FEATURE_KEY, IViewerConfigState } from "src/services/state/viewerConfig.store.helper";
import { shareReplay, tap, switchMap, scan } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { BACKENDURL } from './constants'
import { viewerStateSetFetchedAtlases } from "src/services/state/viewerState.store.helper";

@Injectable({
  providedIn: 'root'
})

export class PureContantService implements OnDestroy{
  
  public useTouchUI$: Observable<boolean>
  public fetchedAtlases$: Observable<any>

  public totalAtlasesLength: number

  private useTouchUiSelector = createSelector(
    state => state[VIEWER_CONFIG_FEATURE_KEY],
    (state: IViewerConfigState) => state.useMobileUI
  )

  constructor(
    private store: Store<any>,
    private http: HttpClient  
  ){
    this.useTouchUI$ = this.store.pipe(
      select(this.useTouchUiSelector),
      shareReplay(1)
    )

    this.fetchedAtlases$ = this.http.get(`${BACKENDURL.replace(/\/$/, '')}/atlases/`, { responseType: 'json' }).pipe(
      tap((arr: any[]) => this.totalAtlasesLength = arr.length),
      switchMap(atlases => merge(
        ...atlases.map(({ url }) => this.http.get(`${BACKENDURL.replace(/\/$/, '')}/${url}`, { responseType: 'json' }))
      )),
      scan((acc, curr) => acc.concat(curr), []),
      shareReplay(1)
    )

    this.subscriptions.push(
      this.fetchedAtlases$.subscribe(fetchedAtlases => 
        this.store.dispatch(
          viewerStateSetFetchedAtlases({ fetchedAtlases })
        )
      )
    )
  }

  private subscriptions: Subscription[] = []

  ngOnDestroy(){
    while(this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
  }
}
