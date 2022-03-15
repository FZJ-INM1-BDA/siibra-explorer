import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"
import { PanelMode } from "./const"

export type UiStore = {
  panelMode: PanelMode
  panelOrder: string // permutation of 0123
  octantRemoval: boolean
  showDelineation: boolean
}

const defaultStore: UiStore = {
  panelMode: 'FOUR_PANEL',
  panelOrder: '0123',
  octantRemoval: false,
  showDelineation: true,
}

export const reducer = createReducer(
  defaultStore,
  on(
    actions.setPanelMode,
    (state, { panelMode }) => {
      return {
        ...state,
        panelMode
      }
    }
  ),
  on(
    actions.setPanelOrder,
    (state, { order }) => {
      return {
        ...state,
        panelOrder: order
      }
    }
  )
)
