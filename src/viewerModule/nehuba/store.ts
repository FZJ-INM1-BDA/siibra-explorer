import { createReducer } from "@ngrx/store";
import { INgLayerInterface } from "src/services/state/ngViewerState.store";


/**
 * TODO port from global store to feature store
 */

enum EnumPanelMode {
  FOUR_PANEL = 'FOUR_PANEL',
  V_ONE_THREE = 'V_ONE_THREE',
  H_ONE_THREE = 'H_ONE_THREE',
  SINGLE_PANEL = 'SINGLE_PANEL',
}

interface INehubaFeature {
  layers: INgLayerInterface[]
  panelMode: string
  panelOrder: string
  octantRemoval: boolean
  clearViewQueue: {
    [key: string]: boolean
  }
}

const defaultState: INehubaFeature = {
  layers: [],
  panelMode: EnumPanelMode.FOUR_PANEL,
  panelOrder: '0123',
  octantRemoval: true,
  clearViewQueue: {}
}

export const reducer = createReducer(
  defaultState
)