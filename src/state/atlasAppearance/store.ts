import { createReducer, on } from "@ngrx/store"
import * as actions from "./action"

export type AtlasAppearanceStore = {
  overwrittenColormap: Record<string, number[]>
}

const defaultState: AtlasAppearanceStore = {
  overwrittenColormap: null
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
  )
)
