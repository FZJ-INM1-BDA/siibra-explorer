import { Action } from '@ngrx/store'

export const defaultState: StateInterface = {
  initManifests: []
}

export interface StateInterface{
  initManifests : [ string, string|null ][]
}

export interface ActionInterface extends Action{
  manifest: {
    name : string,
    initManifestUrl : string | null
  }
}

export const ACTION_TYPES = {
  SET_INIT_PLUGIN: `SET_INIT_PLUGIN`,
  CLEAR_INIT_PLUGIN: 'CLEAR_INIT_PLUGIN'
}

export const CONSTANTS = {
  INIT_MANIFEST_SRC: 'INIT_MANIFEST_SRC'
}

export const getStateStore = ({ state = defaultState } = {}) => (prevState:StateInterface = state, action:ActionInterface):StateInterface => {
  switch(action.type){
    case ACTION_TYPES.SET_INIT_PLUGIN:
      const newMap = new Map(prevState.initManifests )

      // reserved source label for init manifest
      if (action.manifest.name !== CONSTANTS.INIT_MANIFEST_SRC) newMap.set(action.manifest.name, action.manifest.initManifestUrl)
      return {
        ...prevState,
        initManifests: Array.from(newMap)
      }
    case ACTION_TYPES.CLEAR_INIT_PLUGIN:
      const { initManifests } = prevState
      const newManifests = initManifests.filter(([source]) => source !== CONSTANTS.INIT_MANIFEST_SRC)
      return {
        ...prevState,
        initManifests: newManifests
      }
    default:
      return prevState
  }
}

// must export a named function for aot compilation
// see https://github.com/angular/angular/issues/15587
// https://github.com/amcdnl/ngrx-actions/issues/23 
// or just google for:
//
// angular function expressions are not supported in decorators

const defaultStateStore = getStateStore()

export function stateStore(state, action){
  return defaultStateStore(state, action)
}
