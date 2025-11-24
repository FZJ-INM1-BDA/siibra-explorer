import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as userInterface from "../userInterface"
import * as atlasSelection from "../atlasSelection"
import * as actions from "./actions"
import { filter, map, mapTo, pairwise } from "rxjs/operators";
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
    pairwise(),

    /**
     * Per request, only clear feature if
     * 
     * - selected atlas (species) changes OR
     * - selected template changes
     * 
     * This is to accommodate high res 1um slices, which SHOULD NOT be cleared when 
     * a different parcellation is selected (but presumably SHOULD be cleared when atlas/species
     * and/or template/space is changed)
     * 
     * This is a delicate issue. It should be clear from issues if it gets cleared when parameter changes
     */
    filter(([o, n]) => o.atlas.id !== n.atlas.id || o.template.id !== n.template.id),
    map(() => actions.clearShownFeature())
  ))

  constructor(private action: Actions, private store: Store){

  }
}
