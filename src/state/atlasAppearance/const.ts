import { SAPIRegion } from "src/atlasComponents/sapi/core"
export const nameSpace = `[state.atlasAppearance]`

type CustomLayerBase = {
  id: string
}

export type ColorMapCustomLayer = {
  clType: 'customlayer/colormap' | 'baselayer/colormap'
  colormap: WeakMap<SAPIRegion, number[]>
} & CustomLayerBase

export type NgLayerCustomLayer = {
  clType: 'customlayer/nglayer' | 'baselayer/nglayer'
  source: string
  visible?: boolean
  shader?: string
  transform?: number[][]
  opacity?: number
  segments?: (number|string)[]
  // type?: string

  // annotation?: string // TODO what is this used for?
} & CustomLayerBase

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
export type CustomLayer = ColorMapCustomLayer | NgLayerCustomLayer
