import { SxplrAtlas, SxplrTemplate, SxplrParcellation, SxplrRegion, BoundingBox } from "src/atlasComponents/sapi/sxplrTypes"
import { FOCUS_VIEW_LABELS } from "src/util/constants"
import { TSandsPoint, TFace } from "src/util/types"

export const nameSpace = `[state.atlasSelection]`
export type ViewerMode = 'annotating' | 'key frame' | typeof FOCUS_VIEW_LABELS[keyof typeof FOCUS_VIEW_LABELS]
export type BreadCrumb = {
  id: string
  name: string
}

export type AtlasSelectionState = {
  selectedAtlas: SxplrAtlas
  selectedTemplate: SxplrTemplate
  selectedParcellation: SxplrParcellation
  selectedParcellationAllRegions: SxplrRegion[]

  currentViewport: BoundingBox

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

  selectedPoint: TSandsPoint|TFace
}
