import { Injectable } from "@angular/core";
import { Store, createSelector, select } from "@ngrx/store";
import { Observable } from "rxjs";
import { VIEWER_CONFIG_FEATURE_KEY, IViewerConfigState } from "src/services/state/viewerConfig.store.helper";
import { shareReplay } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})

export class PureContantService{
  public useTouchUI$: Observable<boolean>
  private useTouchUiSelector = createSelector(
    state => state[VIEWER_CONFIG_FEATURE_KEY],
    (state: IViewerConfigState) => state.useMobileUI
  )
  constructor(private store: Store<any>){
    this.useTouchUI$ = this.store.pipe(
      select(this.useTouchUiSelector),
      shareReplay(1)
    )
  }
}
