import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"

export type Store = {
  selectedVolumeId: string
}


export const defaultStore: Store = {
  selectedVolumeId: null
}

export const reducer = createReducer(
  defaultStore,
  on(
    actions.selectVolumeById,
    (state, { id }) => {
      return {
        ...state,
        selectedVolumeId: id
      }
    }
  )
)
