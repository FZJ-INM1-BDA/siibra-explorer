import { components, paths, operations } from "./schemaV3"

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

type _FeatureType<FeatureRoute extends SapiRoute> = FeatureRoute extends `/feature/${infer FT}`
  ? FT extends "_types"
    ? never
    : FT extends "{feature_id}"
      ? never
      : FT extends `${infer _FT}/{${infer _FID}}`
        ? never
        : FT
  : never

export type FeatureType = _FeatureType<SapiRoute>

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
