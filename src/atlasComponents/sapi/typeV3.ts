import { components, paths } from "./schemaV3"

export type SapiAtlasModel = PathReturn<"/atlases/{atlas_id}">
export type SapiSpaceModel = PathReturn<"/spaces/{space_id}">
export type SapiParcellationModel = PathReturn<"/parcellations/{parcellation_id}">
export type SapiRegionModel = PathReturn<"/regions/{region_id}">
export type OpenMINDSCoordinatePoint = components['schemas']["CoordinatePointModel"]
export type SxplrCoordinatePointExtension = {
  openminds: OpenMINDSCoordinatePoint
  name: string
  description: string
  color: string
  '@id': string // should match the id of opendminds specs
}
export type SapiSpatialFeatureModel = PathReturn<"/feature/Image/{feature_id}">
export type SapiFeatureModel = SapiSpatialFeatureModel | PathReturn<"/feature/Tabular/{feature_id}"> | PathReturn<"/feature/RegionalConnectivity/{feature_id}"> | PathReturn<"/feature/CorticalProfile/{feature_id}">

export type SapiRoute = keyof paths

type SapiRouteExcludePlotly = Exclude<SapiRoute, "/feature/{feature_id}/plotly">

type _FeatureType<FeatureRoute extends SapiRouteExcludePlotly> = FeatureRoute extends `/feature/${infer FT}`
  ? FT extends "_types"
    ? never
    : FT extends "{feature_id}"
      ? never
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      : FT extends `${infer _FT}/{${infer _FID}}`
        ? never
        : FT
  : never

export type FeatureType = _FeatureType<SapiRouteExcludePlotly>

/**
 * Support types
 */
export type RouteParam<T extends keyof paths> = paths[T]['get']['parameters']
type Json200 = {
  200: {
    content: {
      "application/json": unknown
    }
  }
}
export type PathReturn<T extends keyof paths> = paths[T]["get"]["responses"] extends Json200
  ? paths[T]["get"]["responses"][200]["content"]["application/json"]
  : unknown
export type PaginatedModel<T> = {
  items: T[]
  total: number
  page: number
  size: number
}

type X4Affine = number[][]

type ShaderEnum =
  | "greyscale"
  | "viridis"
  | "plasma"
  | "magma"
  | "inferno"
  | "jet"
/**
 * Preferred colormap in order of preference
 */
type PreferredColormap = ShaderEnum[]
type X1Vector = [number, number, number]
/**
 * Best locations to view this volume.
 */
type BestViewPoints = (PointGeometry | PlaneGeometry | EnclosedROI)[]

export interface MetaV1Schema {
  version: 1
  data?: GenericImage | SingleChannelImage | ThreeChannelImage
  transform?: X4Affine
  preferredColormap?: PreferredColormap
  override?: Override
  bestViewPoints?: BestViewPoints
}
/**
 * Generic image, with arbitary dimensions.
 */
interface GenericImage {
  type: "image"
  range?: ValueRange[]
}
/**
 * Describes the range of values
 */
interface ValueRange {
  min?: number
  max?: number
}
/**
 * Describes an image with 1 dimension, e.g. used as greyscale image.
 */
interface SingleChannelImage {
  type: "image/1d"
  range?: [ValueRange]
}
/**
 * Describes an image with 3 dimensions, mostly used as RGB image.
 */
interface ThreeChannelImage {
  type: "image/3d"
  range?: [ValueRange, ValueRange, ValueRange]
}
/**
 * Overrides provide some low level/implementation hints. They are more prone to breaking, and thus should be used with the knowledge as such.
 */
interface Override {
  /**
   * Hints that client should use this shader for the volume in neuroglancer
   */
  shader?: string
}
interface PointGeometry {
  type: "point"
  value?: X1Vector
}
interface PlaneGeometry {
  type: "plane"
}
interface EnclosedROI {
  type: "enclosed"
  points: PointGeometry[]
}

export function isEnclosed(v: BestViewPoints[number]): v is EnclosedROI {
  return v.type === "enclosed"
}
