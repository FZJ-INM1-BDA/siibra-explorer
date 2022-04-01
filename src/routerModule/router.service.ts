import { Injectable } from "@angular/core";
import { APP_BASE_HREF } from "@angular/common";
import { Inject } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router'
import { Store } from "@ngrx/store";
import { debounceTime, distinctUntilChanged, filter, finalize, map, mapTo, shareReplay, startWith, switchMap, switchMapTo, take, tap, withLatestFrom } from "rxjs/operators";
import { encodeCustomState, decodeCustomState, verifyCustomState } from "./util";
import { BehaviorSubject, combineLatest, concat, EMPTY, merge, NEVER, Observable, of, timer } from 'rxjs'
import { scan } from 'rxjs/operators'
import { RouteStateTransformSvc } from "./routeStateTransform.service";
import { SAPI } from "src/atlasComponents/sapi";
import { generalActions } from "src/state";
/**
 * http://localhost:8080/#/a:juelich:iav:atlas:v1.0.0:1/t:minds:core:referencespace:v1.0.0:dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2/p:minds:core:parcellationatlas:v1.0.0:94c1125b-b87e-45e4-901c-00daee7f2579-290/@:0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIy..0.14gY0~.14gY0..1LSm
 */
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
    store$: Store<any>,
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
      switchMap(() => navEnd$),
      map(navEv => navEv.urlAfterRedirects),
      switchMap(url =>
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
      withLatestFrom(
        store$,
        this.customRoute$.pipe(
          startWith({})
        )
      )
    ).subscribe(arg => {
      const [{ stateFromRoute, url }, currentState, customRoutes] = arg
      const fullPath = url
      
      let routeFromState: string
      try {
        routeFromState = routeToStateTransformSvc.cvtStateToRoute(currentState)
      } catch (_e) {
        routeFromState = ``
      }

      for (const key in customRoutes) {
        const customStatePath = encodeCustomState(key, customRoutes[key])
        if (!customStatePath) continue
        routeFromState += `/${customStatePath}`
      }
      if ( fullPath !== `/${routeFromState}`) {
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
            map(state => {
              try {
                return routeToStateTransformSvc.cvtStateToRoute(state)
              } catch (e) {
                this.logError(e)
                return ``
              }
            })
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
      if (routePath === '') {
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
          router.navigateByUrl(joinedRoutes)
        }
      }
    })
  }
}
