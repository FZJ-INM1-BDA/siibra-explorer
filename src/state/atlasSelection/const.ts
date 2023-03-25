import { SxplrAtlas, SxplrTemplate, SxplrParcellation, SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"

export const nameSpace = `[state.atlasSelection]`
export type ViewerMode = 'annotating' | 'key frame'
export type BreadCrumb = {
  id: string
  name: string
}

export type AtlasSelectionState = {
  selectedAtlas: SxplrAtlas
  selectedTemplate: SxplrTemplate
  selectedParcellation: SxplrParcellation
  selectedParcellationAllRegions: SxplrRegion[]

  selectedRegions: SxplrRegion[]
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
