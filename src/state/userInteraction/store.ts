import { createReducer, on } from "@ngrx/store";
import { SxplrRegion, Feature, Point, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import * as actions from "./actions"

export type UserInteraction = {
  mouseoverRegions: SxplrRegion[]
  selectedFeature: Feature
  mouseoverPosition: Point
  mousedOverVoiFeature: VoiFeature
}

export const defaultState: UserInteraction = {
  selectedFeature: null,
  mouseoverRegions: [],
  mouseoverPosition: null,
  mousedOverVoiFeature: null,
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
      /**
       * do not process compound feature
       * allow component to deal with with dialogbox
       */
      if (feature.id.startsWith("cf0::")) {
        return { ...state }
      }
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
  ),
  on(
    actions.setMouseoverVoi,
    (state, { feature }) => ({
      ...state,
      mousedOverVoiFeature: feature
    })
  )
)
