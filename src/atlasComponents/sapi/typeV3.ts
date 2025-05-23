import { components, paths } from "./schemaV3"
import { MetaV1Schema, BestViewPoint, EnclosedGeometry } from "./volumeMeta"

export { MetaV1Schema }

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

type SapiRouteExcludePlotlyDownload = Exclude<SapiRoute, "/feature/{feature_id}/plotly" | "/feature/{feature_id}/download" | "/feature/{feature_id}/intents">

type _FeatureType<FeatureRoute extends SapiRouteExcludePlotlyDownload> = FeatureRoute extends `/feature/${infer FT}`
  ? FT extends "_types"
    ? never
    : FT extends "{feature_id}"
      ? never
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      : FT extends `${infer _FT}/{${infer _FID}}`
        ? never
        : FT
  : never

export type FeatureType = _FeatureType<SapiRouteExcludePlotlyDownload>

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

export function isEnclosed(v: BestViewPoint): v is EnclosedGeometry {
  return v.type === "enclosed"
}

export type Qualification = components["schemas"]["Qualification"]

// export type CompoundFeature = components['schemas']['CompoundFeatureModel']
