import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { mapTo } from "rxjs/operators";
import { atlasSelection, userInterface } from "src/state";

@Injectable()
export class ViewerCtrlEffects {
  onTemplateChangeResetLayout$ = createEffect(() => this.store$.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    mapTo(userInterface.actions.setPanelMode({
      panelMode: "FOUR_PANEL"
    }))
  ))

  constructor(private store$: Store){}
}
