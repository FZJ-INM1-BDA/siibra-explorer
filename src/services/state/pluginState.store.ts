import { Action } from '@ngrx/store'


export interface StateInterface{
  initManifests : Map<string,string|null>
}

export interface ActionInterface extends Action{
  manifest: {
    name : string,
    initManifestUrl : string | null
  }
}

export const ACTION_TYPES = {
  SET_INIT_PLUGIN: `SET_INIT_PLUGIN`
}

export function stateStore(prevState:StateInterface = {initManifests : new Map()}, action:ActionInterface):StateInterface{
  switch(action.type){
    case ACTION_TYPES.SET_INIT_PLUGIN:
      const newMap = new Map(prevState.initManifests )
      return {
        ...prevState,
        initManifests: newMap.set(action.manifest.name, action.manifest.initManifestUrl)
      }
    default:
      return prevState
  }
}
