import { createSelector } from "@ngrx/store";
import { PluginStore } from "./store"
import { nameSpace } from "./const"

const storeSelector = state => state[nameSpace] as PluginStore

export const initManfests = createSelector(
  storeSelector,
  state => state.initManifests
)
