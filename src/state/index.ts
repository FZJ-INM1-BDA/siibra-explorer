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

function debug(reducer: ActionReducer<MainState>): ActionReducer<MainState> {
  return function(state, action) {
    // console.log('state', state);
    // console.log('action', action);
 
    return reducer(state, action);
  };
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
    generalApplyStateReducer,
    debug,
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
  ]
}

import { MainState } from "./const"
import { generalApplyState } from "./actions"

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
