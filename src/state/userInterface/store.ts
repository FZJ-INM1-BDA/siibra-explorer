import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"

export type UiStore = {
  useMobileUi: boolean
}

const defaultStore: UiStore = {
  useMobileUi: false
}

export const reducer = createReducer(
  defaultStore,
  on(
    actions.useModileUi,
    (state, { flag }) => {
      return {
        ...state,
        useMobileUi: flag
      }
    }
  ),
)
