import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as actions from "./actions"
import * as atlasSelectionActions from "../atlasSelection/actions"
import { mapTo } from "rxjs/operators";

@Injectable()
export class Effect {
  onStandAloneVolumesExistCloseMatDrawer = createEffect(() => this.action.pipe(
    ofType(atlasSelectionActions.clearStandAloneVolumes),
    mapTo(actions.closeSidePanel())
  ))

  constructor(private action: Actions){

  }
}