import { OperatorFunction } from "rxjs"
import { map } from "rxjs/operators"
import { components, operations, paths } from "./schema"

export type IdName = {
  id: string
  name: string
}

type Point = [number, number, number]

export type BoundingBoxConcept = [Point, Point]

export type SapiAtlasModel = components["schemas"]["SapiAtlasModel"]
export type SapiSpaceModel = components["schemas"]["SapiSpaceModel"]
export type SapiParcellationModel = components["schemas"]["SapiParcellationModel"]
export type SapiRegionModel = components["schemas"]["siibra__openminds__SANDS__v3__atlas__parcellationEntityVersion__Model"]
export type OpenMINDSCoordinatePoint = components['schemas']['siibra__openminds__SANDS__v3__miscellaneous__coordinatePoint__Model']
export type SxplrCoordinatePointExtension = {
  openminds: OpenMINDSCoordinatePoint
  name: string
  description: string
  color: string
  '@id': string // should match the id of opendminds specs
}

export type SapiRegionMapInfoModel = components["schemas"]["NiiMetadataModel"]
export type SapiVOIDataResponse = components["schemas"]["VOIDataModel"]
export type SapiVolumeModel = components["schemas"]["VolumeModel"]
export type SapiDatasetModel = components["schemas"]["DatasetJsonModel"]
export type SpyNpArrayDataModel = components["schemas"]["NpArrayDataModel"]
export type SapiIeegSessionModel = components["schemas"]["IEEGSessionModel"]
/**
 * utility types
 */
type PathReturn<T extends keyof paths> = Required<paths[T]["get"]["responses"][200]["content"]["application/json"]>

/**
 * serialization error type
 */
export type SapiSerializationErrorModel = components["schemas"]["SerializationErrorModel"]

/**
 * datafeatures from operations
 */

export type SapiRegionalFeatureModel = PathReturn<"/atlases/{atlas_id}/parcellations/{parcellation_id}/regions/{region_id}/features/{feature_id}">
export type SapiParcellationFeatureModel = PathReturn<"/atlases/{atlas_id}/parcellations/{parcellation_id}/features/{feature_id}">
export type SapiSpatialFeatureModel = PathReturn<"/atlases/{atlas_id}/spaces/{space_id}/features/{feature_id}">

export type SapiFeatureModel = SapiRegionalFeatureModel | SapiSpatialFeatureModel | SapiParcellationFeatureModel

/**
 * specific data features
 */

export type SapiRegionalFeatureReceptorModel = components["schemas"]["ReceptorDatasetModel"]
export type SapiParcellationFeatureMatrixModel = components["schemas"]["ConnectivityMatrixDataModel"]


export const CLEANED_IEEG_DATASET_TYPE = 'sxplr/cleanedIeegDataset'
export type CleanedIeegDataset = Required<
  Omit<SapiDatasetModel, "@type"> & {
    '@type': 'sxplr/cleanedIeegDataset'
    sessions: Record<string, Omit<SapiIeegSessionModel, "dataset">>
  }
>

export function cleanIeegSessionDatasets(ieegSessions: SapiIeegSessionModel[]): CleanedIeegDataset[]{
  const returnArr: CleanedIeegDataset[] = []
  for (const sess of ieegSessions) {
    const { dataset, ...itemToAppend } = sess
    const existing = returnArr.find(it => it["@id"] === dataset["@id"])
    if (!existing) {
      returnArr.push({
        ...dataset,
        '@type': CLEANED_IEEG_DATASET_TYPE,
        sessions: {
          [sess.sub_id]: itemToAppend
        }
      })
      continue
    }
    existing.sessions[sess.sub_id] = itemToAppend
  }
  return returnArr
}

export type SxplrCleanedFeatureModel = CleanedIeegDataset

export function guardPipe<
  InputType,
  GuardType extends InputType
>(
    guardFn: (input: InputType) => input is GuardType
): OperatorFunction<InputType, GuardType> {
  return src => src.pipe(
    map(val => {
      if (guardFn(val)) {
        return val
      }
      throw new Error(`TypeGuard Error`)
    })
  )
}

export type SapiQueryParam = {
  priority: number
}
