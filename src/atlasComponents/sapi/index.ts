export { SAPIModule } from './module'
export { SpatialFeatureBBox } from './directives/spatialFeatureBBox.directive'

export {
  SapiAtlasModel,
  SapiParcellationModel,
  SapiSpaceModel,
  SapiRegionModel,
  SapiVolumeModel,
  SapiDatasetModel,
  SapiRegionalFeatureModel,
  SapiSpatialFeatureModel
} from "./type"

import { SapiRegionalFeatureModel, SapiSpatialFeatureModel } from "./type"
export type SapiFeatureModel = SapiRegionalFeatureModel | SapiSpatialFeatureModel

export { SAPI } from "./sapi.service"
export {
  SAPIAtlas,
  SAPISpace,
  SAPIParcellation,
  SAPIRegion
} from "./core"
