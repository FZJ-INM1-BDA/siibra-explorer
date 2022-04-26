import { createReducer, on } from "@ngrx/store";
import { SapiRegionModel, SapiFeatureModel, OpenMINDSCoordinatePoint } from "src/atlasComponents/sapi";
import * as actions from "./actions"

export type UserInteraction = {
  mouseoverRegions: SapiRegionModel[]
  selectedFeature: SapiFeatureModel
  mouseoverPosition: OpenMINDSCoordinatePoint
}

export const defaultState: UserInteraction = {
  selectedFeature: null,
  mouseoverRegions: [],
  mouseoverPosition: null
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
  ),
  on(
    actions.showFeature,
    (state, { feature }) => {
      return {
        ...state,
        selectedFeature: feature
      }
    }
  ),
  on(
    actions.clearShownFeature,
    state => {
      return {
        ...state,
        selectedFeature: null
      }
    }
  ),
  on(
    actions.mouseoverPosition,
    (state, { position }) => {
      return {
        ...state,
        mouseoverPosition: position
      }
    }
  )
)
