import { ActionReducer, StoreModule } from "@ngrx/store"

export { StateModule } from "./state.module"

import * as atlasSelection from "./atlasSelection"
import * as annotation from "./annotations"
import * as userInterface from "./userInterface"
import * as atlasAppearance from "./atlasAppearance"
import * as plugins from "./plugins"
import * as userInteraction from "./userInteraction"
import * as userPreference from "./userPreference"

export {
  atlasSelection,
  annotation,
  userInterface,
  atlasAppearance,
  plugins,
  userInteraction,
  userPreference,
}

export * as generalActions from "./actions"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function debug(reducer: ActionReducer<MainState>): ActionReducer<MainState> {
  return function(state, action) {
    console.log('state', state);
    console.log('action', action);
    return reducer(state, action);
  };
}

function gateKeepUntilRouteParseComplete(reducer: ActionReducer<MainState>): ActionReducer<MainState>{
  let completeFlag = false
  const actions = []
  return function(state, action) {
    const isSystem = action.type.includes("@ngrx")
    if (completeFlag || isSystem) {
      return reducer(state, action)
    }

    let _state = state
    if (action.type === routeParseComplete.type) {
      while (actions.length > 0) {
        const _action = actions.shift() // FIFO
        _state = reducer(_state, _action)
      }
      completeFlag = true
      return reducer(_state, action)
    }

    if (action.type === generalApplyState.type) {

      return reducer(state, action)
    }
    actions.push(action)
    return reducer(state, noop)
  }
}

function generalApplyStateReducer(reducer: ActionReducer<MainState>): ActionReducer<MainState> {
  return function(_state, action) {
    let state = _state
    if (action.type === generalApplyState.type) {
      state = JSON.parse(
        JSON.stringify(
          (action as any).state
        )
      ) 
    }
    return reducer(state, action)
  }
}

export const RootStoreModule = StoreModule.forRoot({
  [userPreference.nameSpace]: userPreference.reducer,
  [atlasSelection.nameSpace]: atlasSelection.reducer,
  [userInterface.nameSpace]: userInterface.reducer,
  [userInteraction.nameSpace]: userInteraction.reducer,
  [annotation.nameSpace]: annotation.reducer,
  [plugins.nameSpace]: plugins.reducer,
  [atlasAppearance.nameSpace]: atlasAppearance.reducer,
},{
  metaReducers: [ 
    gateKeepUntilRouteParseComplete,
    generalApplyStateReducer,
    // debug,
  ]
})

/**
 * 
 * We have to use a function here. At import time, *.Effect(s) 
 * would not yet be defined.
 * 
 * @returns Effects from state
 */
export function getStoreEffects() {
  return [
    plugins.Effects,
    atlasSelection.Effect,
    userInterface.Effects,
    userInteraction.Effect,
    userPreference.Effects,
    atlasAppearance.Effect,
  ]
}

import { MainState } from "./const"
import { generalApplyState, routeParseComplete, noop } from "./actions"

export { MainState }

export const defaultState: MainState = {
  [userPreference.nameSpace]: userPreference.defaultState,
  [atlasSelection.nameSpace]: atlasSelection.defaultState,
  [userInterface.nameSpace]: userInterface.defaultState,
  [userInteraction.nameSpace]: userInteraction.defaultState,
  [annotation.nameSpace]: annotation.defaultState,
  [plugins.nameSpace]: plugins.defaultState,
  [atlasAppearance.nameSpace]: atlasAppearance.defaultState,
}
