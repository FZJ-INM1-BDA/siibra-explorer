import { createReducer, on } from "@ngrx/store"
import * as actions from "./action"
import { UseViewer, CustomLayer } from "./const"

export type AtlasAppearanceStore = {
  useViewer: UseViewer
  octantRemoval: boolean
  showDelineation: boolean
  customLayers: CustomLayer[]
}

export const defaultState: AtlasAppearanceStore = {
  useViewer: null,
  octantRemoval: true,
  showDelineation: true,
  customLayers: []
}

export const reducer = createReducer(
  defaultState,
  on(
    actions.setOctantRemoval,
    (state, { flag }) => {
      return {
        ...state,
        octantRemoval: flag
      }
    }
  ),
  on(
    actions.setShowDelineation,
    (state, { flag }) => {
      return {
        ...state,
        showDelineation: flag
      }
    }
  ),
  on(
    actions.addCustomLayer,
    (state, { customLayer }) => {
      const { customLayers } = state

      return {
        ...state,
        customLayers: [
          customLayer,
          ...customLayers.filter(l => l.id !== customLayer.id)
        ]
      }
    }
  ),
  on(
    actions.removeCustomLayer,
    (state, { id }) => {
      const { customLayers } = state
      return {
        ...state,
        customLayers: customLayers.filter(l => l.id !== id)
      }
    }
  ),
  on(
    actions.setUseViewer,
    (state, { viewer }) => {
      return {
        ...state,
        useViewer: viewer
      }
    }
  )
)
