import { Store } from "@ngrx/store";
import { Input } from "@angular/core";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "../viewerStateController/viewerState.base";
import { IavRootStoreInterface } from "src/services/stateStore.service";

export class RegionBase{

  @Input()
  public region: any

  @Input()
  public isSelected: boolean = false

  constructor(
    private store$: Store<IavRootStoreInterface>,
  ){
    
  }

  navigateToRegion(){
    const { region } = this
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.NAVIGATETO_REGION,
      payload: { region }
    })
  }

  toggleRegionSelected(){
    const { region } = this
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.TOGGLE_REGION_SELECT,
      payload: { region }
    })
  }
}