import { Injectable, OnDestroy } from "@angular/core";
import { Store, createSelector, select } from "@ngrx/store";
import { Observable, merge, Subscription, of } from "rxjs";
import { VIEWER_CONFIG_FEATURE_KEY, IViewerConfigState } from "src/services/state/viewerConfig.store.helper";
import { shareReplay, tap, scan, catchError, filter, mergeMap, switchMapTo, switchMap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { BACKENDURL } from './constants'
import { viewerStateSetFetchedAtlases } from "src/services/state/viewerState.store.helper";

@Injectable({
  providedIn: 'root'
})

export class PureContantService implements OnDestroy{
  
  public useTouchUI$: Observable<boolean>
  public fetchedAtlases$: Observable<any>
  public darktheme$: Observable<boolean>

  public totalAtlasesLength: number

  private useTouchUiSelector = createSelector(
    state => state[VIEWER_CONFIG_FEATURE_KEY],
    (state: IViewerConfigState) => state.useMobileUI
  )

  constructor(
    private store: Store<any>,
    private http: HttpClient,
  ){
    this.darktheme$ = this.store.pipe(
      select(state => state?.viewerState?.templateSelected?.useTheme === 'dark')
    )

    this.useTouchUI$ = this.store.pipe(
      select(this.useTouchUiSelector),
      shareReplay(1)
    )

    this.fetchedAtlases$ = this.http.get(`${BACKENDURL.replace(/\/$/, '')}/atlases/`, { responseType: 'json' }).pipe(
      catchError((err, obs) => of(null)),
      filter(v => !!v),
      tap((arr: any[]) => this.totalAtlasesLength = arr.length),
      switchMap(atlases => merge(
        ...atlases.map(({ url }) => this.http.get(
          /^http/.test(url)
            ? url
            : `${BACKENDURL.replace(/\/$/, '')}/${url}`,
          { responseType: 'json' }))
      )),
      scan((acc, curr) => acc.concat(curr).sort((a, b) => (a.order || 1000) - (b.order || 1001)), []),
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
