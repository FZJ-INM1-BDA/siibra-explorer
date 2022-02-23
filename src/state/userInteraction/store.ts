import { createReducer, on } from "@ngrx/store";
import { SapiRegionModel } from "src/atlasComponents/sapi";
import * as actions from "./actions"

export type UserInteraction = {
  mouseoverRegions: SapiRegionModel[]
}

const defaultState: UserInteraction = {
  mouseoverRegions: []
}

export const reducer = createReducer(
  defaultState,
  on(
    actions.mouseoverRegions,
    (state, { regions }) => {
      return {
        ...state,
        mouseoverRegions: regions
      }
    }
  )
)