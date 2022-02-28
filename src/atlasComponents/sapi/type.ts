import { OperatorFunction } from "rxjs"
import { map } from "rxjs/operators"
import { IVolumeTypeDetail } from "src/util/siibraApiConstants/types"
import { components } from "./schema"

export type IdName = {
  id: string
  name: string
}

type Point = [number, number, number]
type Volume = {
  id: string
  name: string
  url: string
  volume_type: "neuroglancer/precomputed"
  detail: {
    "neuroglancer/precomputed": IVolumeTypeDetail["neuroglancer/precomputed"]
  }
}

export type BoundingBoxConcept = [Point, Point]

export type SapiAtlasModel = components["schemas"]["SapiAtlasModel"]
export type SapiSpaceModel = components["schemas"]["SapiSpaceModel"]
export type SapiParcellationModel = components["schemas"]["SapiParcellationModel"]
export type SapiRegionModel = components["schemas"]["siibra__openminds__SANDS__v3__atlas__parcellationEntityVersion__Model"]

export type SapiSpatialFeatureModel = components["schemas"]["VOIDataModel"]
export type SapiVOIDataResponse = components["schemas"]["VOIDataModel"]

export type SapiVolumeModel = components["schemas"]["VolumeModel"]
export type SapiDatasetModel = components["schemas"]["DatasetJsonModel"]

export type SpyNpArrayDataModel = components["schemas"]["NpArrayDataModel"]

export const guards = {
  isSapiVolumeModel: (val: SapiVolumeModel) => val.type === "siibra/base-dataset"
    && val.data.detail["neuroglancer/precomputed"]
}

/**
 * datafeatures
 */
export type SapiRegionalFeatureReceptorModel = components["schemas"]["ReceptorDatasetModel"]
export type SapiRegionalFeatureModel = components["schemas"]["BaseDatasetJsonModel"] | SapiRegionalFeatureReceptorModel

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
