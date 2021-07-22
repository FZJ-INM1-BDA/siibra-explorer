import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { shareReplay } from "rxjs/operators";
import { CachedFunction } from "src/util/fn";
import { BS_ENDPOINT } from "./constants";
import { IBSSummaryResponse, IBSDetailResponse, TRegion, IFeatureList, IRegionalFeatureReadyDirective } from './type'

function processRegion(region: TRegion) {
  return `${region.name} ${region.status ? region.status : '' }`
}

export type TFeatureCmpInput = {
  region: TRegion
}

export type TRegisteredFeature<V = any> = {
  name: string
  icon: string // fontawesome font class, e.g. `fas fa-link-alt`
  View: new (...arg: any[]) => V
  Ctrl: new (svc: BsFeatureService, data: TFeatureCmpInput) => IRegionalFeatureReadyDirective
}

@Injectable({
  providedIn: 'root'
})
export class BsFeatureService{

  public registeredFeatures: TRegisteredFeature[] = []
  public registeredFeatures$ = new BehaviorSubject<TRegisteredFeature[]>(this.registeredFeatures)
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

  public registerFeature(feature: TRegisteredFeature){
    if (this.registeredFeatures.find(v => v.name === feature.name)) {
      throw new Error(`feature ${feature.name} already registered`)
    }
    this.registeredFeatures.push(feature)
    this.registeredFeatures$.next(this.registeredFeatures)
  }

  public deregisterFeature(name: string){
    this.registeredFeatures = this.registeredFeatures.filter(v => v.name !== name)
    this.registeredFeatures$.next(this.registeredFeatures)
  }
  
  constructor(
    private http: HttpClient,
    @Inject(BS_ENDPOINT) private bsEndpoint: string,
  ){

  }
}
