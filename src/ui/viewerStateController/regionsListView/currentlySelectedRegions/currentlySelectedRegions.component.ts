import { Component } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { distinctUntilChanged, startWith } from "rxjs/operators";
import { DESELECT_REGIONS } from "src/services/state/viewerState.store";
import { IavRootStoreInterface } from "src/services/stateStore.service";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "src/ui/viewerStateController/viewerState.base";

@Component({
  selector: 'currently-selected-regions',
  templateUrl: './currentlySelectedRegions.template.html',
  styleUrls: [
    './currentlySelectedRegions.style.css',
  ],
})

export class CurrentlySelectedRegions {

  public regionSelected$: Observable<any[]>

  constructor(
    private store$: Store<IavRootStoreInterface>,
  ) {

    this.regionSelected$ = this.store$.pipe(
      select('viewerState'),
      select('regionsSelected'),
      startWith([]),
      distinctUntilChanged(),
    )
  }

  public deselectRegion(event: MouseEvent, region: any) {
    this.store$.dispatch({
      type: DESELECT_REGIONS,
      deselectRegions: [region],
    })
  }

  public gotoRegion(event: MouseEvent, region: any) {
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.DOUBLE_CLICK_ON_REGIONHIERARCHY,
      payload: { region },
    })
  }
}
