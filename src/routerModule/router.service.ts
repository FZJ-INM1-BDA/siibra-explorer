import { Injectable } from "@angular/core";
import { APP_BASE_HREF } from "@angular/common";
import { Inject } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router'
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable } from "rxjs";
import { debounceTime, filter, map, mapTo, shareReplay, switchMapTo, take, tap, withLatestFrom } from "rxjs/operators";
import { viewerStateFetchedTemplatesSelector } from "src/services/state/viewerState.store.helper";
import { viewerStateFetchedAtlasesSelector } from "src/services/state/viewerState/selectors";
import { generalApplyState } from "src/services/stateStore.helper";
import { PureContantService } from "src/util";
import { cvtStateToHashedRoutes, cvtFullRouteToState } from "./util";

@Injectable({
  providedIn: 'root'
})

export class RouterService {

  private firstRenderFlag = true
  private allFetchingReady$: Observable<boolean>

  constructor(
    router: Router,
    pureConstantService: PureContantService,
    store$: Store<any>,
    @Inject(APP_BASE_HREF) baseHref: string
  ){

    // could be navigation (history api)
    // could be on init
    const navEnd$ = router.events.pipe(
      filter(ev => ev instanceof NavigationEnd),
      shareReplay(1)
    )

    navEnd$.subscribe()

    this.allFetchingReady$ = combineLatest([
      pureConstantService.getTemplateEndpoint$.pipe(
        filter(arr => !!arr && Array.isArray(arr)),
        map(arr => arr.length)
      ),
      store$.pipe(
        select(viewerStateFetchedTemplatesSelector),
        filter(arr => !!arr && Array.isArray(arr)),
        map(arr => arr.length)
      ),
      store$.pipe(
        select(viewerStateFetchedAtlasesSelector),
        filter(arr => !!arr && Array.isArray(arr)),
        map(arr => arr.length)
      )
    ]).pipe(
      filter(([ expNumTmpl, actNumTmpl, actNumAtlas ]) => {
        return expNumTmpl === actNumTmpl && actNumAtlas === pureConstantService.totalAtlasesLength
      }),
      mapTo(true),
      take(1),
      shareReplay(1),
    )

    this.allFetchingReady$.pipe(
      switchMapTo(
        navEnd$.pipe(
          withLatestFrom(store$)
        )
      )
    ).subscribe(([ev, state]: [NavigationEnd, any]) => {
      const fullPath = ev.urlAfterRedirects
      const newState = cvtFullRouteToState(router.parseUrl(fullPath), state)
      let newUrl: any[]
      try {
        newUrl = cvtStateToHashedRoutes(newState)
      } catch (_e) {
        console.error(`cvtStateToHashedRoutes error`, _e)
      }

      // NB this is required, as parseUrl seems to decode %3A back to :
      // resulting in false positive
      const newRoute = newUrl && router.parseUrl(
        `/${newUrl.join('/')}`
      ).toString()
      const currentRoute = router.routerState.snapshot.url

      // this fn would in principle be invoked every time path changes
      // We are only interested in when path changes as a result of:
      // - on open
      // - on on history
      // on way to do this is by checking the updated route === current route
      // above scenarios would result in newRoute !== currentRoute
      if ( this.firstRenderFlag || newRoute !== currentRoute) {
        this.firstRenderFlag = false
        store$.dispatch(
          generalApplyState({
            state: newState
          })
        )
      }
    })
    
    // TODO this may still be a bit finiky. 
    // we rely on that update of store happens within 160ms
    // which may or many not be 
    this.allFetchingReady$.pipe(
      switchMapTo(
        store$.pipe(
          debounceTime(160),
          map(state => {
            try {
              return cvtStateToHashedRoutes(state)
            } catch (e) {
              return []
            }
          })
        )
      )
    ).subscribe(routes => {
      if (routes.length === 0) {
        router.navigate([ baseHref ])
      } else {
        const joinedRoutes = `/${routes.join('/')}`
        router.navigateByUrl(joinedRoutes)
      }
    })
  }
}
