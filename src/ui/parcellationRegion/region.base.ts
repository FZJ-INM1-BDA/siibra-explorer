import {EventEmitter, Input, Output} from "@angular/core";
import { Store } from "@ngrx/store";
import {SET_CONNECTIVITY_REGION} from "src/services/state/viewerState.store";
import {
  EXPAND_SIDE_PANEL_CURRENT_VIEW,
  IavRootStoreInterface, OPEN_SIDE_PANEL,
  SHOW_SIDE_PANEL_CONNECTIVITY,
} from "src/services/stateStore.service";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "../viewerStateController/viewerState.base";

export class RegionBase {

  @Input()
  public region: any

  @Input()
  public isSelected: boolean = false

  @Input() public hasConnectivity: boolean

  @Output() public closeRegionMenu: EventEmitter<boolean> = new EventEmitter()

  constructor(
    private store$: Store<IavRootStoreInterface>,
  ) {

  }

  public navigateToRegion() {
    this.closeRegionMenu.emit()
    const { region } = this
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.NAVIGATETO_REGION,
      payload: { region },
    })
  }

  public toggleRegionSelected() {
    this.closeRegionMenu.emit()
    const { region } = this
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.TOGGLE_REGION_SELECT,
      payload: { region },
    })
  }

  public showConnectivity(regionName) {
    this.closeRegionMenu.emit()
    // ToDo trigger side panel opening with effect
    this.store$.dispatch({type: OPEN_SIDE_PANEL})
    this.store$.dispatch({type: EXPAND_SIDE_PANEL_CURRENT_VIEW})
    this.store$.dispatch({type: SHOW_SIDE_PANEL_CONNECTIVITY})

    this.store$.dispatch({
      type: SET_CONNECTIVITY_REGION,
      connectivityRegion: regionName,
    })
  }
}
