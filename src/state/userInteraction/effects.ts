import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as userInterface from "../userInterface"
import * as atlasSelection from "../atlasSelection"
import * as actions from "./actions"
import { filter, map, mapTo, skip } from "rxjs/operators";
import { Store } from "@ngrx/store";

@Injectable()
export class Effect {
  onStandAloneVolumesExistCloseMatDrawer = createEffect(() => this.action.pipe(
    ofType(atlasSelection.actions.clearStandAloneVolumes),
    mapTo(userInterface.actions.closeSidePanel())
  ))

  #distinctATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP(),
  )

  onATPUpdateUnselectFeature = createEffect(() => this.#distinctATP$.pipe(
    filter(v => !!v.atlas && !!v.parcellation && !!v.template),
    /**
     * First non empty emit would be from selecting atlas.
     * So ignore it.
     */
    skip(1),
    map(() => actions.clearShownFeature())
  ))

  constructor(private action: Actions, private store: Store){

  }
}
