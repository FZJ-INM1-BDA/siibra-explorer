import { OperatorFunction } from "rxjs"
import { map } from "rxjs/operators"
import { components } from "./schema"

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
export type SapiRegionMapInfoModel = components["schemas"]["NiiMetadataModel"]

export type SapiSpatialFeatureModel = components["schemas"]["VOIDataModel"]
export type SapiVOIDataResponse = components["schemas"]["VOIDataModel"]

export type SapiVolumeModel = components["schemas"]["VolumeModel"]
export type SapiDatasetModel = components["schemas"]["DatasetJsonModel"]

export type SpyNpArrayDataModel = components["schemas"]["NpArrayDataModel"]


export function FeatureTypeGuard(input: SapiFeatureModel) {
  if (input.type === "siibra/core/dataset") {
    return input as SapiDatasetModel
  }
  if (input.type === "siibra/features/connectivity") {
    return input as SapiParcellationFeatureMatrixModel
  }
  if (input.type === "siibra/features/receptor") {
    return input as SapiRegionalFeatureReceptorModel
  }
  if (input.type === "siibra/features/voi") {
    return input as SapiVOIDataResponse
  }
  if (input.type === "spy/serialization-error") {
    return input as SapiSerializationErrorModel
  }
  throw new Error(`cannot parse type: ${input}`)
}

/**
 * serialization error type
 */
export type SapiSerializationErrorModel = components["schemas"]["SerializationErrorModel"]

/**
 * datafeatures
 */
export type SapiRegionalFeatureReceptorModel = components["schemas"]["ReceptorDatasetModel"]
export type SapiRegionalFeatureModel = components["schemas"]["BaseDatasetJsonModel"] | SapiRegionalFeatureReceptorModel

export type SapiParcellationFeatureMatrixModel = components["schemas"]["ConnectivityMatrixDataModel"]
export type SapiParcellationFeatureModel = SapiParcellationFeatureMatrixModel | SapiSerializationErrorModel

export type SapiFeatureModel = SapiRegionalFeatureModel | SapiSpatialFeatureModel | SapiParcellationFeatureModel

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
