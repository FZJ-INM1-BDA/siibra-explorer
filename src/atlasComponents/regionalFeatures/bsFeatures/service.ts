import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { shareReplay } from "rxjs/operators";
import { CachedFunction } from "src/util/fn";
import { BS_ENDPOINT } from "./constants";
import { IBSSummaryResponse, IBSDetailResponse, TRegion, IFeatureList } from './type'

function processRegion(region: TRegion) {
  return `${region.name} ${region.status ? region.status : '' }`
}

@Injectable()
export class BsFeatureService{

  public getAllFeatures$ = this.http.get(`${this.bsEndpoint}/features`).pipe(
    shareReplay(1)
  )

  public listFeatures(region: TRegion){
    const { context } = region
    const { atlas, parcellation } = context
    return this.http.get<IFeatureList>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlas["@id"])}/parcellations/${encodeURIComponent(parcellation['@id'])}/regions/${encodeURIComponent(processRegion(region))}/features`
    )
  }

  @CachedFunction({
    serialization: (featureName, region) => `${featureName}::${processRegion(region)}`
  })
  public getFeatures<T extends keyof IBSSummaryResponse>(featureName: T, region: TRegion){
    const { context } = region
    const { atlas, parcellation } = context
    const url = `${this.bsEndpoint}/atlases/${encodeURIComponent(atlas["@id"])}/parcellations/${encodeURIComponent(parcellation['@id'])}/regions/${encodeURIComponent(processRegion(region))}/features/${encodeURIComponent(featureName)}`
    
    return this.http.get<IBSSummaryResponse[T][]>(
      url
    ).pipe(
      shareReplay(1)
    )
  }

  @CachedFunction({
    serialization: (featureName, region, featureId) => `${featureName}::${processRegion(region)}::${featureId}`
  })
  public getFeature<T extends keyof IBSDetailResponse>(featureName: T, region: TRegion, featureId: string) {
    const { context } = region
    const { atlas, parcellation } = context
    return this.http.get<IBSDetailResponse[T]>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlas["@id"])}/parcellations/${encodeURIComponent(parcellation['@id'])}/regions/${encodeURIComponent(processRegion(region))}/features/${encodeURIComponent(featureName)}/${encodeURIComponent(featureId)}`
    ).pipe(
      shareReplay(1)
    )
  }
  
  constructor(
    private http: HttpClient,
    @Inject(BS_ENDPOINT) private bsEndpoint: string,
  ){

  }
}
