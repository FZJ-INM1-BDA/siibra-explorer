import { createReducer, on } from "@ngrx/store";
import { SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import * as actions from "./actions"
import { ViewerMode, BreadCrumb } from "./const"

export type AtlasSelectionState = {
  selectedAtlas: SapiAtlasModel
  selectedTemplate: SapiSpaceModel
  selectedParcellation: SapiParcellationModel
  selectedParcellationAllRegions: SapiRegionModel[]

  selectedRegions: SapiRegionModel[]
  standAloneVolumes: string[]

  /**
   * the navigation may mean something very different
   * depending on if the user is using threesurfer/nehuba view
   */
  navigation: {
    position: number[]
    orientation: number[]
    zoom: number
    perspectiveOrientation: number[]
    perspectiveZoom: number
  }

  viewerMode: ViewerMode
  breadcrumbs: BreadCrumb[]
}

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
    actions.selectAtlas,
    (state, { atlas }) => {
      return {
        ...state,
        selectedAtlas: atlas
      }
    }
  ),
  on(
    actions.selectTemplate,
    (state, { template }) => {
      return {
        ...state,
        selectedTemplate: template
      }
    }
  ),
  on(
    actions.selectParcellation,
    (state, { parcellation }) => {
      return {
        ...state,
        selectedParcellation: parcellation
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
      if (
        !region.hasAnnotation?.visualizedIn
        && region.hasAnnotation?.internalIdentifier === 'unknown'
      ) {
        return { ...state }
      }
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
