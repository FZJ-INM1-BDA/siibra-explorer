import { IHasId } from "src/util/interfaces";
import { TBSDetail as TReceptorDetail, TBSSummary as TReceptorSummary } from "./receptor/type";
import { KG_REGIONAL_FEATURE_KEY, TBSDetail as TKGDetail, TBSSummary as TKGSummary } from './kgRegionalFeature/type'
import { SIIBRA_FEATURE_KEY, TBSSummary as TIEEGSummary, TBSDEtail as TIEEGDetail } from './ieeg/type'
import { Observable } from "rxjs";
import { InjectionToken } from "@angular/core";

/**
 * change KgRegionalFeature -> EbrainsRegionalDataset in prod
 */

export interface IBSSummaryResponse {
  'ReceptorDistribution': TReceptorSummary
  [KG_REGIONAL_FEATURE_KEY]: TKGSummary
  [SIIBRA_FEATURE_KEY]: TIEEGSummary
}

export interface IBSDetailResponse {
  'ReceptorDistribution': TReceptorDetail
  [KG_REGIONAL_FEATURE_KEY]: TKGDetail
  [SIIBRA_FEATURE_KEY]: TIEEGDetail
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

export interface IRegionalFeatureReadyDirective {
  ngOnDestroy(): void
  busy$: Observable<boolean>
  results$: Observable<IBSSummaryResponse[keyof IBSSummaryResponse][]>
}

export type TContextedFeature<T extends keyof IBSSummaryResponse> = {
  featureName: string
  icon: string
  result: IBSSummaryResponse[T]
}

export const GENERIC_INFO_INJ_TOKEN = new InjectionToken('GENERIC_INFO_INJ_TOKEN')
