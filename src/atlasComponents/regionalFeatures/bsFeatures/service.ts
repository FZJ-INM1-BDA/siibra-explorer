import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { shareReplay } from "rxjs/operators";
import { CachedFunction } from "src/util/fn";
import { BS_ENDPOINT } from "./constants";
import { IBSSummaryResponse, IBSDetailResponse, TRegion, IFeatureList, IRegionalFeatureReadyDirective } from './type'
import { SIIBRA_FEATURE_KEY as IEEG_FEATURE_KEY } from '../bsFeatures/ieeg/type'

function processRegion(region: TRegion) {
  return `${region.name} ${region.status ? region.status : '' }`
}

export type TFeatureCmpInput = {
  region: TRegion
  featureId?: string
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

  static SpaceFeatureSet = new Set([
    IEEG_FEATURE_KEY
  ])

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

  private getUrl(arg: {
    atlasId: string
    parcId: string
    spaceId: string
    region: TRegion
    featureName: string
    featureId?: string
  }){
    const { 
      atlasId,
      parcId,
      spaceId,
      region,
      featureName,
      featureId,
    } = arg

    if (BsFeatureService.SpaceFeatureSet.has(featureName)) {
      
      const url = new URL(`${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/spaces/${encodeURIComponent(spaceId)}/features/${encodeURIComponent(featureName)}${ featureId ? ('/' + encodeURIComponent(featureId)) : '' }`)
      url.searchParams.set('parcellation_id', parcId)
      url.searchParams.set('region', processRegion(region))

      return url.toString()
    }
    
    if (!featureId) {
      return `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/parcellations/${encodeURIComponent(parcId)}/regions/${encodeURIComponent(processRegion(region))}/features/${encodeURIComponent(featureName)}`
    }
    return `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/parcellations/${encodeURIComponent(parcId)}/regions/${encodeURIComponent(processRegion(region))}/features/${encodeURIComponent(featureName)}/${encodeURIComponent(featureId)}`
  }

  @CachedFunction({
    serialization: (featureName, region) => `${featureName}::${processRegion(region)}`
  })
  public getFeatures<T extends keyof IBSSummaryResponse>(featureName: T, region: TRegion){
    const { context } = region
    const { atlas, parcellation, template } = context
    const url = this.getUrl({
      atlasId: atlas['@id'],
      parcId: parcellation['@id'],
      region,
      featureName,
      spaceId: template['@id']
    })
    
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
    const { atlas, parcellation, template } = context
    const url = this.getUrl({
      atlasId: atlas['@id'],
      parcId: parcellation['@id'],
      spaceId: template['@id'],
      region,
      featureName,
      featureId
    })
    return this.http.get<IBSSummaryResponse[T]&IBSDetailResponse[T]>(url).pipe(
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
