import { Injectable, NgZone } from "@angular/core";
import { APP_BASE_HREF } from "@angular/common";
import { Inject } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router'
import { Store } from "@ngrx/store";
import { catchError, debounceTime, distinctUntilChanged, filter, map, mapTo, shareReplay, startWith, switchMap, switchMapTo, take, withLatestFrom } from "rxjs/operators";
import { encodeCustomState, decodeCustomState, verifyCustomState } from "./util";
import { BehaviorSubject, combineLatest, concat, forkJoin, from, merge, Observable, of, timer } from 'rxjs'
import { scan } from 'rxjs/operators'
import { RouteStateTransformSvc } from "./routeStateTransform.service";
import { SAPI } from "src/atlasComponents/sapi";
import { MainState, generalActions } from "src/state";


@Injectable({
  providedIn: 'root'
})

export class RouterService {

  private logError(...e: any[]) {
    console.log(...e)
  }

  private _customRoute$ = new BehaviorSubject<Record<string, string>>({})

  public customRoute$: Observable<Record<string, string>>

  setCustomRoute(key: string, state: string){
    if (!verifyCustomState(key)) {
      throw new Error(`custom state key must start with x- `)
    }
    this._customRoute$.next({
      [key]: state
    })
  }

  constructor(
    router: Router,
    routeToStateTransformSvc: RouteStateTransformSvc,
    sapi: SAPI,
    store$: Store<MainState>,
    private zone: NgZone,
    @Inject(APP_BASE_HREF) baseHref: string
  ){

    // could be navigation (history api)
    // could be on init
    const navEnd$ = router.events.pipe(
      filter<NavigationEnd>(ev => ev instanceof NavigationEnd),
      shareReplay(1)
    )

    navEnd$.subscribe()

    /**
     * onload
     */
    const onload$ = navEnd$.pipe(
      take(1),
      filter(ev => ev.urlAfterRedirects !== '/'),
      switchMap(ev => 
        routeToStateTransformSvc.cvtRouteToState(
          router.parseUrl(
            ev.urlAfterRedirects
          )
        )
      )
    )
    onload$.subscribe(
      state => {
        store$.dispatch(
          generalActions.generalApplyState({
            state
          })
        )
      }
    )

    const ready$ = sapi.atlases$.pipe(
      filter(flag => !!flag),
      take(1),
      shareReplay(1),
    )

    this.customRoute$ = ready$.pipe(
      switchMapTo(
        merge(
          navEnd$.pipe(
            map((ev: NavigationEnd) => {
              const fullPath = ev.urlAfterRedirects
              const customState = decodeCustomState(
                router.parseUrl(fullPath)
              )
              return customState || {}
            }),
          ),
          this._customRoute$
        ).pipe(
          scan<Record<string, string>>((acc, curr) => {
            return {
              ...acc,
              ...curr
            }
          }, {}),
          // TODO add obj eql distinctuntilchanged check
          distinctUntilChanged((o, n) => {
            if (Object.keys(o).length !== Object.keys(n).length) {
              return false
            }
            for (const key in o) {
              if (o[key] !== n[key]) return false
            }
            return true
          }),
        )
      ),
    )

    /**
     * does work too well =( 
     */
    concat(
      onload$.pipe(
        mapTo(false)
      ),
      timer(160).pipe(
        mapTo(false)
      ),
      ready$.pipe(
        map(val => !!val)
      )
    ).pipe(
      filter(flag => flag),
      switchMap(() => navEnd$),
      map(navEv => navEv.urlAfterRedirects),
      switchMap(url =>
        forkJoin([
          from(
            routeToStateTransformSvc.cvtRouteToState(
              router.parseUrl(
                url
              )
            ).then(stateFromRoute => {
              return {
                url,
                stateFromRoute
              }
            })
          ),
          
          store$.pipe(
            switchMap(state => from(routeToStateTransformSvc.cvtStateToRoute(state)).pipe(
              catchError(() => of(``))
            ))
          ),
        ]),
      ),
      withLatestFrom(
        this.customRoute$.pipe(
          startWith({})
        )
      )
    ).subscribe(arg => {
      const [[{ stateFromRoute, url }, _routeFromState ], customRoutes] = arg
      const fullPath = url
      let routeFromState = _routeFromState
      for (const key in customRoutes) {
        const customStatePath = encodeCustomState(key, customRoutes[key])
        if (!customStatePath) continue
        routeFromState += `/${customStatePath}`
      }
      if ( fullPath !== `/${routeFromState}`) {
        /**
         * TODO buggy edge case:
         * if the route changes on viewer load, the already added baselayer/nglayer will be cleared
         * This will result in a white screen (nehuba viewer not showing)
         */
        store$.dispatch(
          generalActions.generalApplyState({
            state: stateFromRoute
          })
        )
      }
    })
    
    /**
     * wait until onload completes
     * wait for 160ms
     * then start listening to store changes, and update route accordingly
     * 
     * this is so that initial state can be loaded
     */
    concat(
      onload$.pipe(
        mapTo(false)
      ),
      timer(160).pipe(
        mapTo(false)
      ),
      ready$.pipe(
        map(val => !!val)
      )
    ).pipe(
      filter(flag => flag),
      switchMapTo(
        combineLatest([
          store$.pipe(
            debounceTime(160),
            switchMap(state =>
              from(routeToStateTransformSvc.cvtStateToRoute(state)).pipe(
                catchError(err => {
                  this.logError(err)
                  return of(``)
                })
              )
            ),
          ),
          this.customRoute$,
        ]).pipe(
          map(([ routePath, customRoutes ]) => {
            let returnPath = routePath
            for (const key in customRoutes) {
              const customStatePath = encodeCustomState(key, customRoutes[key])
              if (!customStatePath) continue
              returnPath += `/${customStatePath}`
            }
            return returnPath
          })
        )
      )
    ).subscribe(routePath => {
      /**
       * routePath may be falsy
       * or empty string
       * both can be caught by !routePath
       */
      if (!routePath) {
        router.navigate([ baseHref ])
      } else {

        // this needs to be done, because, for some silly reasons
        // router decodes encoded ':' character
        // this means, if url is compared with url, it will always be falsy
        // if a non encoded ':' exists
        const currUrlUrlTree = router.parseUrl(router.url)
        const joinedRoutes = `/${routePath}`
        const newUrlUrlTree = router.parseUrl(joinedRoutes)
        
        if (currUrlUrlTree.toString() !== newUrlUrlTree.toString()) {
          this.zone.run(() => {
            router.navigateByUrl(joinedRoutes)
          })
        }
      }
    })
  }
}
