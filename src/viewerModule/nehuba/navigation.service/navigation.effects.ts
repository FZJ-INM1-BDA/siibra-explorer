import { Inject, Injectable, OnDestroy } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { filter, tap, withLatestFrom } from "rxjs/operators";
import { atlasSelection, MainState, userPreference } from "src/state"
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

  constructor(
    private action: Actions,
    private store: Store<MainState>,
    @Inject(NEHUBA_INSTANCE_INJTKN) nehubaInst$: Observable<NehubaViewerUnit>,
  ){
    this.subscription.push(
      nehubaInst$.subscribe(val => this.nehubaInst = val),
    )
  }

  ngOnDestroy(){
    while(this.subscription.length > 0) this.subscription.pop().unsubscribe()
  }
}