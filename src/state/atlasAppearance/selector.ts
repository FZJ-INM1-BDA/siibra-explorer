import { createSelector } from "@ngrx/store"
import { nameSpace } from "./const"
import { AtlasAppearanceStore } from "./store"

const selectStore = state => state[nameSpace] as AtlasAppearanceStore

export const octantRemoval = createSelector(
  selectStore,
  state => state.octantRemoval
)

export const showDelineation = createSelector(
  selectStore,
  state => state.showDelineation
)

export const meshTransparency = createSelector(
  selectStore,
  state => state.meshTransparency
)

export const customLayers = createSelector(
  selectStore,
  state => state.customLayers
)

export const useViewer = createSelector(
  selectStore,
  state => state.useViewer
)
export const showAllSegMeshes = createSelector(
  selectStore,
  state => state.showAllSegMeshes
)
