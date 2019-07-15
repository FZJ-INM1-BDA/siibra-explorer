import {Action, createAction} from '@ngrx/store'


export interface PluginInitManifestInterface{
  initManifests : Map<string,string|null>
}

export interface PluginInitManifestActionInterface extends Action{
  manifest: {
    name : string,
    initManifestUrl : string | null
  }
}

export const PluginInitManifestActionInterface = createAction(
    'SET_INIT_PLUGIN'
);

export const ACTION_TYPES = {
  SET_INIT_PLUGIN: `SET_INIT_PLUGIN`
}

export function pluginState(prevState:PluginInitManifestInterface = {initManifests : new Map()}, action:PluginInitManifestActionInterface):PluginInitManifestInterface{
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









//
//
// import {createAction, createReducer, on, props} from '@ngrx/store'
// // import {ACTION_TYPES} from "src/services/state/viewerConfig.store";
//
//
// export interface PluginInitManifestInterface{
//   initManifests : Map<string,string|null>
// }
//
// // export interface PluginInitManifestActionInterface extends Action{
// //   manifest: {
// //     name : string,
// //     initManifestUrl : string | null
// //   }
// // }
//
// export const PluginInitManifestActionInterface = createAction(
//     'SET_INIT_PLUGIN',
//     props<{
//       manifest: {
//         name : string,
//         initManifestUrl : string | null
//       }
//     }>()
// );
//
// // export const ACTION_TYPES = {
// //   SET_INIT_PLUGIN: `SET_INIT_PLUGIN`
// // }
//
// // export function pluginState(prevState:PluginInitManifestInterface = {initManifests : new Map()}, action:PluginInitManifestActionInterface):PluginInitManifestInterface {
// //
// //
// //   switch(action.type){
// //     case ACTION_TYPES.SET_INIT_PLUGIN:
// //       const newMap = new Map(prevState.initManifests )
// //       return {
// //         ...prevState,
// //         initManifests: newMap.set(action.manifest.name, action.manifest.initManifestUrl)
// //       }
// //     default:
// //       return prevState
// //   }
// // }
//
// const prevState = {initManifests : new Map()}
// export const pluginState =  createReducer(
//     prevState,
//     on(PluginInitManifestActionInterface,
//         (PluginInitManifestInterface, manifest) => {
//           const newMap = new Map(prevState.initManifests )
//           return ({
//             ...prevState,
//             initManifests: newMap.set(manifest['name'], manifest['initManifestUrl'])
//           })})
// )

