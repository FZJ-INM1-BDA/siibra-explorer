import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { of } from "rxjs";
import { mapTo, switchMap } from "rxjs/operators";
import { atlasSelection, userInterface } from "src/state";

@Injectable()
export class ViewerCtrlEffects {
  onTemplateChangeResetLayout$ = createEffect(() => this.store$.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    switchMap(() => of(
      userInterface.actions.setPanelMode({
        panelMode: "FOUR_PANEL"
      }),
      userInterface.actions.setPanelOrder({
        order: '0123'
      }),
    ))
  ))

  constructor(private store$: Store){}
}
