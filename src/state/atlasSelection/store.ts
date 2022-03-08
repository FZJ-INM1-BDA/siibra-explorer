import { createReducer, on } from "@ngrx/store";
import { SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import * as actions from "./actions"
import { ViewerMode } from "./const"

export type AtlasSelectionState = {
  selectedAtlas: SapiAtlasModel
  selectedTemplate: SapiSpaceModel
  selectedParcellation: SapiParcellationModel
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
}

export const defaultState: AtlasSelectionState = {
  selectedAtlas: null,
  selectedParcellation: null,
  selectedRegions: [],
  selectedTemplate: null,
  standAloneVolumes: [],
  navigation: null,
  viewerMode: null
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
    actions.selectRegions,
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
  )
)

export {
  reducer
}
