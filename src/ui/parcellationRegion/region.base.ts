import { Store } from "@ngrx/store";
import {EventEmitter, Input, Output} from "@angular/core";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "../viewerStateController/viewerState.base";
import {
  EXPAND_SIDE_PANEL_CURRENT_VIEW,
  IavRootStoreInterface, OPEN_SIDE_PANEL,
  SHOW_SIDE_PANEL_CONNECTIVITY
} from "src/services/stateStore.service";
import {SET_CONNECTIVITY_REGION} from "src/services/state/viewerState.store";

export class RegionBase{

  @Input()
  public region: any

  @Input()
  public isSelected: boolean = false

  @Input() hasConnectivity: boolean
  @Output() exploreConnectivity: EventEmitter<string> = new EventEmitter()

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

  showConnectivity(regionName) {
    //ToDo trigger side panel opening with effect
    this.store$.dispatch({type: OPEN_SIDE_PANEL})
    this.store$.dispatch({type: EXPAND_SIDE_PANEL_CURRENT_VIEW})
    this.store$.dispatch({type: SHOW_SIDE_PANEL_CONNECTIVITY})

    this.store$.dispatch({
      type: SET_CONNECTIVITY_REGION,
      connectivityRegion: regionName
    })
  }
}