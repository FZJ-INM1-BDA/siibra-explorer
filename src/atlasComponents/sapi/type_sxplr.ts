/**
 * Here, you will find the type interface used by siibra-explorer
 * SAPI types can change in the future, but hopefully, the setup can allow
 * a much smoother transition to new API
 */


/**
 * TODO do a global search on type_v3
 * anything outside src/atlasComponent should directly import from type_sxplr, and not from type_v3, or worse type, schema_v3
 */

export type SxplrRegion = {
  id: string
  name: string
  centroid?: Point
  color?: [number, number, number]
  parentIds:string[]
} & Partial<AdditionalInfo>

export type SxplrParcellation = {
  id: string
  name: string
  modality?: string
} & Partial<AdditionalInfo>

export type SxplrTemplate = {
  id: string
  name: string
} & Partial<AdditionalInfo>

export type SxplrAtlas = {
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
  space: SxplrTemplate
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

/**
 * Features
 */

export type Feature = {
  id: string
  name: string
} & Partial<AdditionalInfo>

type DataFrame = {
  index: Record<string, string>
}

export type VoiFeature = {
  bbox: BoundingBox
} & Feature

type TabularDataType = number | string | number[]

export type TabularFeature<T extends TabularDataType> = {
  index: string[]
  columns: string[]
  data: T[][]
} & Feature

export type LabelledMap = {
  name: string
  label: number
}
