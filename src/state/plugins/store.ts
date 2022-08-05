import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"

export type PluginStore = {
  initManifests: Record<string, string[]>
}

export const defaultState: PluginStore = {
  initManifests: {}
}

export const reducer = createReducer(
  defaultState,
  on(
    actions.clearInitManifests,
    (state, { nameSpace }) => {
      if (!state.initManifests[nameSpace]) return state
      const newMan: Record<string, string[]> = {}
      const { initManifests } = state
      for (const key in initManifests) {
        if (key === nameSpace) continue
        newMan[key] = initManifests[key]
      }
      return {
        ...state,
        initManifests: newMan
      }
    }
  ),
)
