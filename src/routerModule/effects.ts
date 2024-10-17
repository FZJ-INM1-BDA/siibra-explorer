import { Inject, Injectable, NgZone } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { catchError, debounceTime, filter, map, shareReplay, switchMap, take, tap, withLatestFrom } from "rxjs/operators";
import { createEffect } from "@ngrx/effects"
import { RouteStateTransformSvc } from "./routeStateTransform.service";
import { IDS, SAPI } from "src/atlasComponents/sapi";
import { MainState, atlasSelection, generalActions } from "src/state"
import { combineLatest, from, of } from "rxjs";
import { Store } from "@ngrx/store";
import { RouterService } from "./router.service";
import { encodeCustomState } from "./util"
import { STATE_DEBOUNCE_MS } from "./const"
import { APP_BASE_HREF } from "@angular/common";
import { GET_ATTR_TOKEN } from "src/util/constants";
import { CONST } from 'common/constants'

@Injectable()
export class RouterEffects {

  isFreeMode = !!this.getattr(CONST.FREE_MODE)

  #navEnd$ = this.router.events.pipe(
    filter<NavigationEnd>(ev => ev instanceof NavigationEnd),
    shareReplay(1)
  )

  #state$ = this.store.pipe(
    shareReplay(1),
  )
  
  #customState$ = this.routerSvc.customRoute$.pipe(
    shareReplay(1)
  )

  #atlasesLoaded$ = this.sapi.atlases$.pipe(
    filter(atlases => (atlases || []).length > 0),
    map(() => true),
    shareReplay(1),
  )

  onViewerLoad$ = createEffect(() => this.#navEnd$.pipe(
    take(1),
    switchMap(ev => {
      if (this.isFreeMode) {
        return of(
          generalActions.noop()
        )
      }
      return combineLatest([
        from(
          this.routeToStateTransformSvc.cvtRouteToState(
            this.router.parseUrl(ev.urlAfterRedirects)
          )
        ),
        this.sapi.atlases$
      ]).pipe(
        map(([state, atlases]) => {
          const { "[state.atlasSelection]": atlasSelectionState } = state

          /**
           * condition by which a default atlas is selected
           * if no atlas is selected by default
           */
          if (!atlasSelectionState.selectedAtlas) {
            const humanAtlas = atlases.find(atlas => atlas.id === IDS.ATLAES.HUMAN)
            if (humanAtlas) {
              return atlasSelection.actions.selectATPById({
                atlasId: IDS.ATLAES.HUMAN,
                parcellationId: IDS.PARCELLATION.JBA31,
                templateId: IDS.TEMPLATES.MNI152,
              })
            }
          }

          /**
           * otherwise, apply returned state
           */
          return generalActions.generalApplyState({
            state
          })
        }),
        switchMap(ac => from([
          ac,
          generalActions.routeParseComplete()
        ]))
      )
    }),
  ))

  onRouteUpdate$ = createEffect(() => this.#atlasesLoaded$.pipe(
    switchMap(() => this.#navEnd$),
    map(ev => ev.urlAfterRedirects),
    switchMap(urlAfterRedirect => 
      from(this.routeToStateTransformSvc.cvtRouteToState(
        this.router.parseUrl(urlAfterRedirect)
      )).pipe(
        map(stateFromRoute => {
          return {
            stateFromRoute,
            urlAfterRedirect
          }
        }),
      ).pipe(
        withLatestFrom(
          this.#state$.pipe(
            switchMap(state => 
              from(this.routeToStateTransformSvc.cvtStateToRoute(state)).pipe(
                catchError(() => of(``))
              )
            )
          ),
          this.#customState$
        )
      )
    ),
    filter(([ { urlAfterRedirect }, _routeFromState, customRoutes ]) => {
      let routeFromState = _routeFromState
      for (const key in customRoutes) {
        const customStatePath = encodeCustomState(key, customRoutes[key])
        if (!customStatePath) continue
        routeFromState += `/${customStatePath}`
      }
      return urlAfterRedirect !== `/${routeFromState}`
    }),
    map(([ { stateFromRoute }, ..._others ]) => generalActions.generalApplyState({ state: stateFromRoute })),
  ))

  onStateUpdated$ = createEffect(() => this.#atlasesLoaded$.pipe(
    switchMap(() => combineLatest([
      this.#state$.pipe(
        debounceTime(STATE_DEBOUNCE_MS),
        switchMap(state =>
          from(this.routeToStateTransformSvc.cvtStateToRoute(state)).pipe(
            catchError(() => of(``)),
          )
        )
      ),
      this.#customState$
    ])),
    tap(([ routePath, customRoutes ]) => {
      let finalRoutePath = routePath
      for (const key in customRoutes) {
        const customStatePath = encodeCustomState(key, customRoutes[key])
        if (!customStatePath) continue
        finalRoutePath += `/${customStatePath}`
      }
      
      /**
       * routePath may be falsy
       * or empty string
       * both can be caught by !routePath
       */
      if (!finalRoutePath) {
        this.router.navigate([ this.baseHref ])
      } else {

        // this needs to be done, because, for some silly reasons
        // router decodes encoded ':' character
        // this means, if url is compared with url, it will always be falsy
        // if a non encoded ':' exists
        const currUrlUrlTree = this.router.parseUrl(this.router.url)
        
        const joinedRoutes = `/${finalRoutePath}`
        const newUrlUrlTree = this.router.parseUrl(joinedRoutes)
        
        if (currUrlUrlTree.toString() !== newUrlUrlTree.toString()) {
          this.zone.run(() => {
            this.router.navigateByUrl(joinedRoutes)
          })
        }
      }
    })
  ), { dispatch: false })

  constructor(
    private router: Router,
    private routerSvc: RouterService,
    private sapi: SAPI,
    private routeToStateTransformSvc: RouteStateTransformSvc,
    private store: Store<MainState>,
    private zone: NgZone,
    @Inject(APP_BASE_HREF) private baseHref: string,
    @Inject(GET_ATTR_TOKEN) private getattr: (attrName: string) => string
  ){
    
  }
}
