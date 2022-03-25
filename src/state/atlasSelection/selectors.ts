import { createSelector } from "@ngrx/store"
import { nameSpace, AtlasSelectionState } from "./const"

export const viewerStateHelperStoreName = 'viewerStateHelper'

const selectStore = (state: any) => state[nameSpace] as AtlasSelectionState

export const selectedAtlas = createSelector(
  selectStore,
  state => state.selectedAtlas
)

export const selectedTemplate = createSelector(
  selectStore,
  state => state.selectedTemplate
)

export const selectedParcellation = createSelector(
  selectStore,
  state => state.selectedParcellation
)

export const selectedParcAllRegions = createSelector(
  selectStore,
  state => state.selectedParcellationAllRegions
)

export const selectedRegions = createSelector(
  selectStore,
  state => state.selectedRegions
)

export const standaloneVolumes = createSelector(
  selectStore,
  state => state.standAloneVolumes
)

export const navigation = createSelector(
  selectStore,
  state => state.navigation
)

export const viewerMode = createSelector(
  selectStore,
  state => state.viewerMode
)

export const breadCrumbs = createSelector(
  selectStore,
  state => state.breadcrumbs
)