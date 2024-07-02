import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"
import { AtlasSelectionState } from "./const"

export const defaultState: AtlasSelectionState = {
  selectedAtlas: null,
  selectedParcellation: null,
  selectedParcellationAllRegions: [],
  selectedRegions: [],
  selectedTemplate: null,
  standAloneVolumes: [],
  navigation: null,
  viewerMode: null,
  breadcrumbs: [],
  selectedPoint: null,
  currentViewport: null,
}

const reducer = createReducer(
  defaultState,
  on(
    actions.setAtlasSelectionState,
    (state, partialState) => {
      return {
        ...state,
        ...partialState
      }
    }
  ),
  on(
    actions.setSelectedParcellationAllRegions,
    (state, { regions }) => {
      return {
        ...state,
        selectedParcellationAllRegions: regions
      }
    }
  ),
  on(
    actions.selectRegion,
    (state, { region }) => {
      const selected = state.selectedRegions.length === 1 && state.selectedRegions.find(r => r.name === region.name)
      return {
        ...state,
        selectedRegions: selected
          ? [ ]
          : [ region ]
      }
    }
  ),
  on(
    actions.toggleRegion,
    (state, { region }) => {
      const selected = state.selectedRegions.find(r => r.name === region.name)
      return {
        ...state,
        selectedRegions: selected
          ? state.selectedRegions.filter(r => r.name !== region.name)
          : [...state.selectedRegions, region]
      }
    }
  ),
  on(
    actions.setSelectedRegions,
    (state, { regions }) => {
      return {
        ...state,
        selectedRegions: regions
      }
    }
  ),
  on(
    actions.setStandAloneVolumes,
    (state, { standAloneVolumes }) => {
      return {
        ...state,
        standAloneVolumes
      }
    }
  ),
  on(
    actions.setNavigation,
    (state, { navigation }) => {
      return {
        ...state,
        navigation
      }
    }
  ),
  on(
    actions.setViewerMode,
    (state, { viewerMode }) => {
      return {
        ...state,
        viewerMode
      }
    }
  ),
  on(
    actions.showBreadCrumb,
    (state, { breadcrumb }) => {
      return {
        ...state,
        breadcrumbs: [
          ...state.breadcrumbs.filter(bc => bc.id !== breadcrumb.id),
          breadcrumb
        ]
      }
    }
  ),
  on(
    actions.selectAtlas,
    (state, { atlas }) => {
      if (atlas?.id === state?.selectedAtlas?.id) {
        return { ...state }
      }
      return {
        ...state,
        selectedAtlas: atlas,
      }
    }
  ),
  on(
    actions.dismissBreadCrumb,
    (state, { id }) => {
      return {
        ...state,
        breadcrumbs: state.breadcrumbs.filter(bc => bc.id !== id)
      }
    }
  ),
  on(
    actions.selectPoint,
    (state, { point }) => {
      return {
        ...state,
        selectedPoint: point
      }
    }
  ),
  on(
    actions.clearSelectedPoint,
    state => {
      return {
        ...state,
        selectedPoint: null
      }
    }
  ),
  on(
    actions.setViewport,
    (state, { viewport }) => {
      return {
        ...state,
        currentViewport: viewport
      }
    }
  )
)

export {
  reducer
}
