import { Inject, Injectable, OnDestroy } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, Subscription } from "rxjs";
import { filter, map, mapTo, tap, withLatestFrom } from "rxjs/operators";
import { atlasSelection, MainState, userInterface, userPreference } from "src/state"
import { CYCLE_PANEL_MESSAGE } from "src/util/constants";
import { timedValues } from "src/util/generator";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { NEHUBA_INSTANCE_INJTKN } from "../util";
import { navAdd, navMul } from "./navigation.util";

@Injectable()
export class NehubaNavigationEffects implements OnDestroy{

  private subscription: Subscription[] = []
  private nehubaInst: NehubaViewerUnit
  private rafRef: number

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
  onNavigateTo = createEffect(() => this.action.pipe(
    ofType(atlasSelection.actions.navigateTo),
    filter(() => !!this.nehubaInst),
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
        this.nehubaInst.setNavigationState({
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
        
        /**
         * if nehubaInst becomes nullish whilst animation is running
         */  
        if (!this.nehubaInst) {
          this.rafRef = null
          return
        }

        const next = gen.next()
        const d =  next.value

        const n = navAdd(src, navMul(delta, d))
        this.nehubaInst.setNavigationState({
          ...n,
          positionReal: true
        })

        if ( !next.done ) {
          this.rafRef = requestAnimationFrame(() => animate())
        } else {
          this.rafRef = null
        }
      }
      this.rafRef = requestAnimationFrame(() => animate())

    })
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

  constructor(
    private action: Actions,
    private store: Store<MainState>,
    @Inject(NEHUBA_INSTANCE_INJTKN) nehubaInst$: Observable<NehubaViewerUnit>,
  ){
    this.subscription.push(
      nehubaInst$.subscribe(val => this.nehubaInst = val),
    )
  }

  ngOnDestroy(): void {
    while(this.subscription.length > 0) this.subscription.pop().unsubscribe()
  }
}