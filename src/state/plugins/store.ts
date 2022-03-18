import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"
import { INIT_MANIFEST_SRC } from "./const"

export type PluginStore = {
  initManifests: Record<string, string>
}

export const defaultState: PluginStore = {
  initManifests: {}
}

export const reducer = createReducer(
  defaultState,
  on(
    actions.clearInitManifests,
    (state, { nameSpace }) => {
      if (!state[nameSpace]) return state
      const newMan: Record<string, string> = {}
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
  on(
    actions.setInitMan,
    (state, { nameSpace, url, internal }) => {
      if (!internal) {
        if (nameSpace === INIT_MANIFEST_SRC) return state
      }
      const { initManifests } = state
      return {
        ...state,
        initManifests: {
          ...initManifests,
          [nameSpace]: url
        }
      }
    }
  )
)
