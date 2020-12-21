import { Action } from '@ngrx/store'
import { GENERAL_ACTION_TYPES } from '../stateStore.service'
import { PLUGINSTORE_ACTION_TYPES } from './pluginState.helper'
export const defaultState: StateInterface = {
  initManifests: []
}

export interface StateInterface {
  initManifests: Array<[ string, string|null ]>
}

export interface ActionInterface extends Action {
  manifest: {
    name: string
    initManifestUrl?: string
  }
}


export const PLUGINSTORE_CONSTANTS = {
  INIT_MANIFEST_SRC: 'INIT_MANIFEST_SRC',
}

export const getStateStore = ({ state = defaultState } = {}) => (prevState: StateInterface = state, action: ActionInterface): StateInterface => {
  switch (action.type) {
  case PLUGINSTORE_ACTION_TYPES.SET_INIT_PLUGIN: {
    const newMap = new Map(prevState.initManifests )

    // reserved source label for init manifest
    if (action.manifest.name !== PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC) { newMap.set(action.manifest.name, action.manifest.initManifestUrl) }
    return {
      ...prevState,
      initManifests: Array.from(newMap),
    }
  }
  case PLUGINSTORE_ACTION_TYPES.CLEAR_INIT_PLUGIN: {
    const { initManifests } = prevState
    const newManifests = initManifests.filter(([source]) => source !== PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC)
    return {
      ...prevState,
      initManifests: newManifests,
    }
  }
  case GENERAL_ACTION_TYPES.APPLY_STATE: {
    const { pluginState } = (action as any).state
    return pluginState
  }
  default: return prevState
  }
}

// must export a named function for aot compilation
// see https://github.com/angular/angular/issues/15587
// https://github.com/amcdnl/ngrx-actions/issues/23
// or just google for:
//
// angular function expressions are not supported in decorators

const defaultStateStore = getStateStore()

export function stateStore(state, action) {
  return defaultStateStore(state, action)
}
