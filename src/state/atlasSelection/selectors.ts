import { createSelector } from "@ngrx/store"
import { nameSpace, AtlasSelectionState } from "./const"

export const viewerStateHelperStoreName = 'viewerStateHelper'

export const selectStore = (state: any) => state[nameSpace] as AtlasSelectionState

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

export const selectedPoint = createSelector(
  selectStore,
  state => state.selectedPoint
)

export const relevantSelectedPoint = createSelector(
  selectedTemplate,
  selectedPoint,
  (tmpl, point) => {
    if (!tmpl || !point) {
      return null
    }
    const { ['@id']: spcId } = point.coordinateSpace
    if (spcId === tmpl.id) {
      return point
    }
    return null
  }
)

export const currentViewport = createSelector(
  selectStore,
  store => store.currentViewport
)
