import { createSelector } from "@ngrx/store"
import { nameSpace } from "./const"
import { AtlasAppearanceStore } from "./store"

const selectStore = state => state[nameSpace] as AtlasAppearanceStore

export const getOverwrittenColormap = createSelector(
  selectStore,
  state => state.overwrittenColormap
)

export const octantRemoval = createSelector(
  selectStore,
  state => state.octantRemoval
)

export const showDelineation = createSelector(
  selectStore,
  state => state.showDelineation
)