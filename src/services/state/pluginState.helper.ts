import { createSelector } from "@ngrx/store"

export const PLUGINSTORE_ACTION_TYPES = {
  SET_INIT_PLUGIN: `SET_INIT_PLUGIN`,
  CLEAR_INIT_PLUGIN: 'CLEAR_INIT_PLUGIN',
}

export const pluginStateSelectorInitManifests = createSelector(
  state => state['pluginState'],
  pluginState => pluginState.initManifests
)

export const PLUGINSTORE_CONSTANTS = {
  INIT_MANIFEST_SRC: 'INIT_MANIFEST_SRC',
}
