/**
 * Here, you will find the type interface used by siibra-explorer
 * SAPI types can change in the future, but hopefully, the setup can allow
 * a much smoother transition to new API
 */


/**
 * TODO do a global search on typeV3
 * anything outside src/atlasComponent should directly import from sxplrTypes, and not from typeV3, or worse type, schemaV3
 */

export type SxplrRegion = {
  type: 'SxplrRegion'
  id: string
  name: string
  centroid?: Point
  color?: [number, number, number]
  parentIds:string[]
} & Partial<AdditionalInfo>

export type SxplrParcellation = {
  type: 'SxplrParcellation'
  id: string
  name: string
  modality?: string
} & Partial<AdditionalInfo>

export type SxplrTemplate = {
  type: 'SxplrTemplate'
  id: string
  name: string
} & Partial<AdditionalInfo>

export type SxplrAtlas = {
  type: 'SxplrAtlas'
  id: string
  name: string
} & Partial<AdditionalInfo>

export type AdditionalInfo = {
  desc: string
  link: {
    text: string
    href: string
  }[]
}

type Location = {
  readonly space: SxplrTemplate
}
type LocTuple = [number, number, number]

export type Point = {
  loc: LocTuple
} & Location

export type BoundingBox = {
  maxpoint: LocTuple
  minpoint: LocTuple
  center: LocTuple
} & Location

import { NgLayerSpec } from "src/viewerModule/nehuba/config.service/type"

export { NgLayerSpec }
export {
  NgPrecompMeshSpec,
  NgSegLayerSpec,
} from "src/viewerModule/nehuba/config.service/type"

import { TThreeSurferMesh, TThreeMesh, TThreeMeshLabel } from "src/viewerModule/threeSurfer/types"
export { TThreeSurferMesh, TThreeMesh, TThreeMeshLabel }

/**
 * Union of processed image
 */
export type TemplateDefaultImage = NgLayerSpec | TThreeMesh

export type LabelledMap = {
  name: string
  label: number
}

export type StatisticalMap = {
  url: string
  min: number
  max: number
}

/**
 * Features
 */

export type Feature = {
  id: string
  name: string
  category?: string
} & Partial<AdditionalInfo>

type DataFrame = {
  index: Record<string, string>
}

export type VoiFeature = {
  bbox: BoundingBox
  ngVolume: {
    url: string
    transform: number[][]
    info: Record<string, any>
  }
} & Feature

type CorticalDataType = number

export type CorticalFeature<T extends CorticalDataType, IndexType extends string|number=string> = {
  indices?: IndexType[]
  corticalProfile?: T[]
} & Feature

type TabularDataType = number | string | number[]

export type TabularFeature<T extends TabularDataType> = {
  index: string[]
  columns: string[]
  data?: T[][]
} & Feature

export type GenericInfo = {
  name: string
} & AdditionalInfo
