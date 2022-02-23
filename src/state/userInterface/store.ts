import { createReducer, on } from "@ngrx/store";
import { SapiVolumeModel } from "src/atlasComponents/sapi";
import * as actions from "./actions"

export type UiStore = {
  selectedFeature: SapiVolumeModel
}

const defaultStore: UiStore = {
  selectedFeature: null
}

export const reducer = createReducer(
  defaultStore,
  on(
    actions.showFeature,
    (state, { feature }) => {
      return {
        ...state,
        feature
      }
    }
  ),
  on(
    actions.clearShownFeature,
    state => {
      return {
        ...state,
        feature: null
      }
    }
  )
)
