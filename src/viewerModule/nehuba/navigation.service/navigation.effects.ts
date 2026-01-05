import { Injectable, OnDestroy } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { combineLatest, NEVER, of, Subscription } from "rxjs";
import { debounce, distinctUntilChanged, filter, map, mapTo, switchMap, tap, withLatestFrom } from "rxjs/operators";
import { atlasSelection, MainState, userInterface, userPreference } from "src/state"
import { CYCLE_PANEL_MESSAGE } from "src/util/constants";
import { timedValues } from "src/util/generator";
import { NavigationBaseSvc } from "./navigation.base.service";
import { navAdd, navMul, navObjEqual } from "./navigation.util";

@Injectable()
export class NehubaNavigationEffects implements OnDestroy{

  private subscription: Subscription[] = []

  /**
   * This is an implementation which reconciles local state with the global navigation state.
   * - it should **never** set global state.
   * - there exist two (potential) source of navigation state change
   *    - directly set via global state (with statuscard, url, etc)
   *    - via viewer (mostly through user interaction)
   *   if the latter were emitted, it is the local's responsibility to check the (debounced) diff between local/global state,
   *   and update global state accordingly.
   * - This effect updates the internal navigation state. It should leave reporting any diff to the local viewer's native implementation.
   */
  onNavigateTo = createEffect(() => this.baseSvc.nehubaViewerUnit$.pipe(
    switchMap(nehubaInst => this.action.pipe(
      ofType(atlasSelection.actions.navigateTo),
      withLatestFrom(
        this.store.pipe(
          select(userPreference.selectors.useAnimation)
        ),
        this.store.pipe(
          select(atlasSelection.selectors.navigation)
        )
      ),
      tap(([{ navigation, animation, physical }, globalAnimationFlag, currentNavigation]) => {
        if (!animation || !globalAnimationFlag) {
          nehubaInst.setNavigationState({
            ...navigation,
            positionReal: physical
          })
          return
        }
  
        const gen = timedValues()
        const src = currentNavigation
  
        const dest = {
          ...src,
          ...navigation
        }
  
        const delta = navAdd(dest, navMul(src, -1))
  
        const animate = () => {
          
  
          const next = gen.next()
          const d =  next.value
  
          const n = navAdd(src, navMul(delta, d))
          nehubaInst.setNavigationState({
            ...n,
            positionReal: physical
          })
  
          if ( !next.done ) {
            requestAnimationFrame(() => animate())
          }
        }
        requestAnimationFrame(() => animate())
  
      })
    )),
  ), { dispatch: false })

  onMaximise = createEffect(() => combineLatest([
    this.store.pipe(
      select(userPreference.selectors.useMobileUi),
    ),
    this.store.pipe(
      select(userInterface.selectors.panelMode),
      map(mode => mode === "SINGLE_PANEL")
    )
  ]).pipe(
    filter(([ useMobileUi, singlePanelMode ]) => singlePanelMode && !useMobileUi),
    mapTo(
      userInterface.actions.snackBarMessage({
        message: CYCLE_PANEL_MESSAGE
      })
    )
  ))

  onStoreNavigationUpdate = createEffect(() => this.store.pipe(
    select(atlasSelection.selectors.navigation),
    distinctUntilChanged((o, n) => navObjEqual(o, n)),
    withLatestFrom(
      this.baseSvc.viewerNavLock$,
      /**
       * n.b. if NEHUBA_INSTANCE_INJTKN is not provided, this obs will never emit
       * which, semantically is the correct behaviour
       */
      this.baseSvc.nehubaViewerUnit$,
      this.baseSvc.nehubaViewerUnit$.pipe(
        switchMap(nvUnit => nvUnit.viewerPositionChange)
      )
    ),
    filter(([nav, lock, _nvUnit, viewerNav]) => {
      return !lock && !navObjEqual(nav, viewerNav)
    }),
    tap(([nav, _lock, nvUnit, _viewerNav]) => {
      nvUnit.setNavigationState(nav)
    })
  ), { dispatch: false })

  onViewerNavigationUpdate = createEffect(() => this.baseSvc.nehubaViewerUnit$.pipe(
    switchMap(nvUnit => 
      nvUnit.viewerPositionChange.pipe(
        debounce(() => this.baseSvc.viewerNavLock$.pipe(
          filter(lock => !lock),
        )),
        withLatestFrom(
          this.store.pipe(
            select(atlasSelection.selectors.navigation)
          )
        ),
        switchMap(([ val, storedNav ]) => {
          const { zoom, perspectiveZoom, position } = val
          const roundedZoom = Math.round(zoom)
          const roundedPz = Math.round(perspectiveZoom)
          const roundedPosition = position.map(v => Math.round(v)) as [number, number, number]
          const roundedNav = {
            ...val,
            zoom: roundedZoom,
            perspectiveZoom: roundedPz,
            position: roundedPosition,
          }
          if (navObjEqual(roundedNav, storedNav)) {
            return NEVER
          }
          return of(
            atlasSelection.actions.setNavigation({
              navigation: roundedNav
            })
          )
        })
      )
    )
  ))

  constructor(
    private action: Actions,
    private store: Store<MainState>,
    private baseSvc: NavigationBaseSvc,
  ){
  }

  ngOnDestroy(): void {
    while(this.subscription.length > 0) this.subscription.pop().unsubscribe()
  }
}