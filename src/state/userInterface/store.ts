import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"
import { PanelMode } from "./const"

export type UiStore = {
  panelMode: PanelMode
  panelOrder: string // permutation of 0123
}

export const defaultState: UiStore = {
  panelMode: "FOUR_PANEL",
  panelOrder: "0123",
}

export const reducer = createReducer(
  defaultState,
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
