import { SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi"

export const nameSpace = `[state.atlasSelection]`
export type ViewerMode = 'annotating' | 'key frame'
export type BreadCrumb = {
  id: string
  name: string
}

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
