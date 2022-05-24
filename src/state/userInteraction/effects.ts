import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as atlasSelectionActions from "../atlasSelection/actions"
import * as userInterface from "../userInterface"
import { mapTo } from "rxjs/operators";

@Injectable()
export class Effect {
  onStandAloneVolumesExistCloseMatDrawer = createEffect(() => this.action.pipe(
    ofType(atlasSelectionActions.clearStandAloneVolumes),
    mapTo(userInterface.actions.closeSidePanel())
  ))

  constructor(private action: Actions){

  }
}