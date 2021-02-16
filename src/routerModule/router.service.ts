import { Injectable } from "@angular/core";
import { APP_BASE_HREF } from "@angular/common";
import { Inject } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router'
import { Store } from "@ngrx/store";
import { debounceTime, filter, map, shareReplay, switchMapTo, take, withLatestFrom } from "rxjs/operators";
import { generalApplyState } from "src/services/stateStore.helper";
import { PureContantService } from "src/util";
import { cvtStateToHashedRoutes, cvtFullRouteToState } from "./util";

@Injectable({
  providedIn: 'root'
})

export class RouterService {

  private logError(...e: any[]) {
    console.log(...e)
  }

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

    const ready$ = pureConstantService.allFetchingReady$.pipe(
      filter(flag => !!flag),
      take(1),
      shareReplay(1),
    )

    ready$.pipe(
      switchMapTo(
        navEnd$.pipe(
          withLatestFrom(store$)
        )
      )
    ).subscribe(([ev, state]: [NavigationEnd, any]) => {
      const fullPath = ev.urlAfterRedirects
      const stateFromRoute = cvtFullRouteToState(router.parseUrl(fullPath), state, this.logError)
      let routeFromState: string[]
      try {
        routeFromState = cvtStateToHashedRoutes(state)
      } catch (_e) {
        routeFromState = []
      }

      if ( fullPath !== `/${routeFromState.join('/')}`) {
        store$.dispatch(
          generalApplyState({
            state: stateFromRoute
          })
        )
      }
    })
    
    // TODO this may still be a bit finiky. 
    // we rely on that update of store happens within 160ms
    // which may or many not be 
    ready$.pipe(
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
        const currUrl = router.routerState.snapshot.url
        const joinedRoutes = `/${routes.join('/')}`
        if (currUrl !== joinedRoutes) {
          router.navigateByUrl(joinedRoutes)
        }
      }
    })
  }
}
