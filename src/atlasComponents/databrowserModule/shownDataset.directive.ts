import { Directive } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { uiStateShownDatasetIdSelector } from "src/services/state/uiState/selectors";

@Directive({
  selector: '[iav-shown-dataset]',
  exportAs: 'iavShownDataset'
})

export class ShownDatasetDirective{
  public shownDatasetId$: Observable<string[]>
  constructor(
    store$: Store<any>
  ){
    this.shownDatasetId$ = store$.pipe(
      select(uiStateShownDatasetIdSelector)
    )
  }
}
