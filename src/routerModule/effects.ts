import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter, map, shareReplay, switchMap, take } from "rxjs/operators";
import { createEffect } from "@ngrx/effects"
import { RouteStateTransformSvc } from "./routeStateTransform.service";
import { IDS, SAPI } from "src/atlasComponents/sapi";
import { atlasSelection, generalActions } from "src/state"
import { combineLatest, from } from "rxjs";

@Injectable()
export class RouterEffects {
  #navEnd$ = this.router.events.pipe(
    filter<NavigationEnd>(ev => ev instanceof NavigationEnd),
    shareReplay(1)
  )

  onViewerLoad$ = createEffect(() => this.#navEnd$.pipe(
    take(1),
    switchMap(ev => {
      return combineLatest([
        from(
          this.routeToStateTransformSvc.cvtRouteToState(
            this.router.parseUrl(ev.urlAfterRedirects)
          )
        ),
        this.sapi.atlases$
      ])
    }),
    map(([state, atlases]) => {
      const { "[state.atlasSelection]": atlasSelectionState } = state

      /**
       * condition by which a default atlas is selected
       * if no atlas is selected by default
       */
      if (!atlasSelectionState.selectedAtlas) {
        const humanAtlas = atlases.find(atlas => atlas.id === IDS.ATLAES.HUMAN)
        if (humanAtlas) {
          return atlasSelection.actions.selectAtlas({
            atlas: humanAtlas
          })
        }
      }

      /**
       * otherwise, apply returned state
       */
      return generalActions.generalApplyState({
        state
      })
    })
  ))

  constructor(
    private router: Router,
    private sapi: SAPI,
    private routeToStateTransformSvc: RouteStateTransformSvc,
  ){
  }
}
