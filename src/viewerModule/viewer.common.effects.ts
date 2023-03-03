import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { of } from "rxjs";
import { distinctUntilChanged, map, switchMap } from "rxjs/operators";
import * as atlasSelection from "src/state/atlasSelection";
import * as atlasAppearance from "src/state/atlasAppearance"
import { SAPI } from "src/atlasComponents/sapi";

@Injectable()
export class ViewerCommonEffects {
  onATPSetUseViewer$ = createEffect(() => this.store.pipe(
    select(atlasSelection.selectors.standaloneVolumes),
    distinctUntilChanged((o, n) => o?.length === n?.length),
    switchMap(volumes => volumes?.length > 0
      ? of( atlasAppearance.const.useViewer.NEHUBA )
      : this.store.pipe(
        select(atlasSelection.selectors.selectedTemplate),
        distinctUntilChanged((o, n) => o?.id === n?.id),
        switchMap(template => this.sapi.useViewer(template))
      )
    ),
    map(viewer => atlasAppearance.actions.setUseViewer({ viewer }))
  ))

  constructor(private store: Store, private sapi: SAPI){

  }
}
