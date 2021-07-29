import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Observable } from "rxjs";
import { mapTo } from "rxjs/operators";
import { DATASETS_ACTIONS_TYPES } from "../state/dataStore.store";
import { viewerStateNewViewer } from "../state/viewerState/actions";

@Injectable({
  providedIn: 'root'
})

export class NewTemplateUseEffect{

  @Effect()
  public onNewTemplateShouldClearPreviewDataset$: Observable<any>

  constructor(
    private actions$: Actions
  ){
    this.onNewTemplateShouldClearPreviewDataset$ = this.actions$.pipe(
      ofType(viewerStateNewViewer.type),
      mapTo({
        type: DATASETS_ACTIONS_TYPES.CLEAR_PREVIEW_DATASETS
      })
    )
  }
}
