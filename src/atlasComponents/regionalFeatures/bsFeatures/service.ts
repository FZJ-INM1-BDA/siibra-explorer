import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { shareReplay } from "rxjs/operators";
import { BS_ENDPOINT, TFeature, TRegion } from "./constants";

@Injectable()
export class BsFeatureService{

  public getAllFeatures$ = this.http.get(`${this.bsEndpoint}/features`).pipe(
    shareReplay(1)
  )

  private processRegion(region: TRegion) {
    return `${region.name} ${region.status ? region.status : '' }`
  }

  public getFeature<T>(featureName: TFeature, region: TRegion) {
    return this.http.get<T>(`${this.bsEndpoint}/features/${featureName}?region=${encodeURIComponent(this.processRegion(region))}`)
  }
  
  constructor(
    private http: HttpClient,
    @Inject(BS_ENDPOINT) private bsEndpoint: string,
  ){

  }
}
