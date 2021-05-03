import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { shareReplay } from "rxjs/operators";
import { BS_ENDPOINT, IBSSummaryResponse, IBSDetailResponse, TRegion } from "./constants";

@Injectable()
export class BsFeatureService{

  public getAllFeatures$ = this.http.get(`${this.bsEndpoint}/features`).pipe(
    shareReplay(1)
  )

  private processRegion(region: TRegion) {
    return `${region.name} ${region.status ? region.status : '' }`
  }

  public getFeatures<T extends keyof IBSSummaryResponse>(featureName: T, region: TRegion){
    const { context } = region
    const { atlas, parcellation } = context
    return this.http.get<IBSSummaryResponse[T][]>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlas["@id"])}/parcellations/${encodeURIComponent(parcellation['@id'])}/regions/${encodeURIComponent(this.processRegion(region))}/features/${encodeURIComponent(featureName)}`
    )
  }

  public getFeature<T extends keyof IBSDetailResponse>(featureName: T, region: TRegion, featureId: string) {
    const { context } = region
    const { atlas, parcellation } = context
    return this.http.get<IBSDetailResponse[T]>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlas["@id"])}/parcellations/${encodeURIComponent(parcellation['@id'])}/regions/${encodeURIComponent(this.processRegion(region))}/features/${encodeURIComponent(featureName)}/${encodeURIComponent(featureId)}`
    )
  }
  
  constructor(
    private http: HttpClient,
    @Inject(BS_ENDPOINT) private bsEndpoint: string,
  ){

  }
}
