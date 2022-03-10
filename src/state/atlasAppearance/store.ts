import { createReducer, on } from "@ngrx/store"
import * as actions from "./action"

export type AtlasAppearanceStore = {
  overwrittenColormap: Record<string, number[]>
  octantRemoval: boolean
  showDelineation: boolean
}

const defaultState: AtlasAppearanceStore = {
  overwrittenColormap: null,
  octantRemoval: true,
  showDelineation: true,
}

export const reducer = createReducer(
  defaultState,
  on(
    actions.overwriteColorMap,
    (state, { colormap }) => {
      return {
        ...state,
        overwrittenColormap: colormap
      }
    }
  ),
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
)
