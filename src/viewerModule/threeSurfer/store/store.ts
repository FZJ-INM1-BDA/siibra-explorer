import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"

export type Store = {
  selectedSurfaceVariant: string
}


export const defaultStore: Store = {
  selectedSurfaceVariant: null
}

export const reducer = createReducer(
  defaultStore,
  on(
    actions.selectSurfaceVariant,
    (state, { variant }) => {
      return {
        ...state,
        selectedSurfaceVariant: variant
      }
    }
  )
)
