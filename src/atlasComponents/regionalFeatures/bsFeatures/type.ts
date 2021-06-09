import { IHasId } from "src/util/interfaces";
import { TBSDetail as TReceptorDetail, TBSSummary as TReceptorSummary } from "./receptor/type";
import { KG_REGIONAL_FEATURE_KEY, TBSDetail as TKGDetail, TBSSummary as TKGSummary } from './kgRegionalFeature/type'

/**
 * change KgRegionalFeature -> EbrainsRegionalDataset in prod
 */

export interface IBSSummaryResponse {
  'ReceptorDistribution': TReceptorSummary
  [KG_REGIONAL_FEATURE_KEY]: TKGSummary
}

export interface IBSDetailResponse {
  'ReceptorDistribution': TReceptorDetail
  [KG_REGIONAL_FEATURE_KEY]: TKGDetail
}

export type TRegion = {
  name: string
  status?: string
  context: {
    atlas: IHasId
    template: IHasId
    parcellation: IHasId
  }
}

export interface IFeatureList {
  features: {
    [key: string]: string
  }[]
}
