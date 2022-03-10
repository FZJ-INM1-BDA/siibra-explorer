import { ActionReducer, StoreModule } from "@ngrx/store"

export { StateModule } from "./state.module"

import * as atlasSelection from "./atlasSelection"
import * as annotation from "./annotations"
import * as userInterface from "./userInterface"
import * as atlasAppearance from "./atlasAppearance"
import * as plugins from "./plugins"
import * as userInteraction from "./userInteraction"
import * as userPreference from "./userPreference"
import { EffectsModule } from "@ngrx/effects"

export {
  atlasSelection,
  annotation,
  userInterface,
  atlasAppearance,
  plugins,
  userInteraction,
  userPreference,
}

export function debug(reducer: ActionReducer<any>): ActionReducer<any> {
  return function(state, action) {
    console.log('state', state);
    console.log('action', action);
 
    return reducer(state, action);
  };
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
    // debug,
  ]
})

export const RootEffecsModule = EffectsModule.forRoot([
  plugins.Effects,
  atlasSelection.Effect,
  userInterface.Effects,
])