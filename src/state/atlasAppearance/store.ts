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
    actions.toggleParcDelineation,
    state => {
      return {
        ...state,
        showDelineation: !state.showDelineation
      }
    }
  ),
  on(
    actions.addCustomLayers,
    (state, { customLayers: addCLayers }) => {
      const { customLayers } = state
      const idToAdd = new Set(addCLayers.map(({ id }) => id))
      return {
        ...state,
        customLayers: [
          ...addCLayers,
          ...customLayers.filter(l => !idToAdd.has(l.id))
        ]
      }
    }
  ),
  on(
    actions.removeCustomLayers,
    (state, { customLayers: removeCLayers }) => {
      const idsToRemove = new Set(removeCLayers.map(({ id }) => id))
      const { customLayers } = state
      return {
        ...state,
        customLayers: customLayers.filter(l => !idsToRemove.has(l.id) )
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
