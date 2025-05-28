import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
export const nameSpace = `[state.atlasAppearance]`

type CustomLayerBase = {
  id: string
  meta?: {
    filename?: string
    messages?: string[]
    insertIndex?: number
  }
}

type NgLayerBase = {
  clType: 'customlayer/nglayer' | 'baselayer/nglayer'
  sxplrAnnotations?: Record<string, string>
} & CustomLayerBase

export type GenericCustomLayer = {
  clType: 'customlayer/generic'
} & CustomLayerBase

export type ColorMapCustomLayer = {
  clType: 'customlayer/colormap' | 'baselayer/colormap'
  colormap: WeakMap<SxplrRegion, number[]>
} & CustomLayerBase

export type ThreeSurferCustomLayer = {
  clType: 'baselayer/threesurfer'
  source: string
  laterality: 'left' | 'right'
  name: string
} & CustomLayerBase

export type ThreeSurferCustomLabelLayer = {
  clType: 'baselayer/threesurfer-label/gii-label' | 'baselayer/threesurfer-label/annot'
  source: string
  laterality: 'left' | 'right'
} & CustomLayerBase

export type NewNgLayerOption = {
  legacySpecFlag: 'new'
  type: 'image'
  name?: string
  blend: 'default' | 'additive'
  visible: boolean
  shader?: string
  opacity?: number
  source: {
    url: string
    transform: {
      inputDimensions: Record<string, [number, string]>
      outputDimensions: Record<string, [number, string]>
      matrix: number[][]
      sourceRank: number
    }
  }
} & NgLayerBase

export type OldNgLayerCustomLayer = {
  legacySpecFlag: 'old'
  source: string
  visible?: boolean
  shader?: string
  transform?: number[][]
  opacity?: number
  segments?: (number|string)[]
  type?: string

  // annotation?: string // TODO what is this used for?
} & NgLayerBase

export type NgLayerCustomLayer = NewNgLayerOption | OldNgLayerCustomLayer

/**
 * custom layer is a catch all term that apply **any** special looks
 * to an atlas. it could include:
 * 
 * - different colormap
 * - different volume (pmap)
 * - different indicies
 * 
 * It is up to the viewer on how to interprete these information.
 * each instance **must** contain a clType and an id
 * - clType facilitates viewer on how to interprete the custom layer
 * - id allows custom layer to be removed, if necessary
 */
export type CustomLayer = ColorMapCustomLayer | NgLayerCustomLayer | ThreeSurferCustomLayer | ThreeSurferCustomLabelLayer | GenericCustomLayer

export const useViewer = {
  THREESURFER: "THREESURFER",
  NEHUBA: "NEHUBA",
  NOT_SUPPORTED: "NOT_SUPPORTED" 
} as const

export type UseViewer = keyof typeof useViewer
