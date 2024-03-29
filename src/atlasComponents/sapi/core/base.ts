import { Observable } from "rxjs"
import { SAPI } from "../sapi.service"
import { RouteParam } from "../typeV3"

const AllFeatures = {
  CorticalProfile: "CorticalProfile",
  EbrainsDataFeature: "EbrainsDataFeature",
  RegionalConnectivity: "RegionalConnectivity",
  Tabular: "Tabular",
  // GeneExpressions: "GeneExpressions",
  Image: "Image",
} as const

type AF = keyof typeof AllFeatures

export abstract class SAPIBase<T extends AF> {

  public abstract features$: Observable<string[]>

  constructor(
    private _sapi: SAPI,
  ){}

  getFeatures(featureType: T, param: RouteParam<`/feature/${T}`>) {
    const route = `/feature/${featureType}` as `/feature/${T}`
    return this._sapi.v3Get(route, param)
  }
  
  getFeatureInstance(featureType: T, param: RouteParam<`/feature/${T}/{feature_id}`>) {
    const route = `/feature/${featureType}/{feature_id}` as `/feature/${T}/{feature_id}`
    return this._sapi.v3Get(route, param)
  }
}
