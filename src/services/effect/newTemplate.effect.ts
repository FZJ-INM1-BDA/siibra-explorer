import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Observable } from "rxjs";
import { NEWVIEWER } from "../state/viewerState.store";
import { mapTo, tap } from "rxjs/operators";
import { DATASETS_ACTIONS_TYPES } from "../state/dataStore.store";

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
      ofType(NEWVIEWER),
      tap(() => console.log(`new`)),
      mapTo({
        type: DATASETS_ACTIONS_TYPES.CLEAR_PREVIEW_DATASETS
      })
    )
  }
}
