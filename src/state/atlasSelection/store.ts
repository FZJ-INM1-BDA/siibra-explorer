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
  breadcrumbs: []
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
      /**
       * if roi does not have visualizedIn defined
       * or internal identifier
       * 
       * ignore
       */
      const selected = state.selectedRegions.includes(region)
      return {
        ...state,
        selectedRegions: selected
          ? [ ]
          : [ region ]
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
  )
)

export {
  reducer
}
