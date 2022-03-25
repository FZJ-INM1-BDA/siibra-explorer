import { Observable } from "rxjs"
import { SAPI } from '../sapi.service'
import { camelToSnake } from 'common/util'
import { SapiQueryParam, SapiSpaceModel, SapiSpatialFeatureModel, SapiVolumeModel } from "../type"

type FeatureResponse = {
  features: {
    [key: string]: string
  }
}

type RegionalSpatialFeatureOpts = {
  parcellationId: string
  region: string
}

type BBoxSpatialFEatureOpts = {
  bbox: string
}

type SpatialFeatureOpts = RegionalSpatialFeatureOpts | BBoxSpatialFEatureOpts

export class SAPISpace{

  constructor(private sapi: SAPI, public atlasId: string, public id: string){}

  getModalities(param?: SapiQueryParam): Observable<FeatureResponse> {
    return this.sapi.httpGet<FeatureResponse>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features`,
      null,
      param
    )
  }

  getFeatures(modalityId: string, opts: SpatialFeatureOpts): Observable<SapiSpatialFeatureModel[]> {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(opts)) {
      query[camelToSnake(key)] = value
    }
    return this.sapi.httpGet<SapiSpatialFeatureModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features/${encodeURIComponent(modalityId)}`,
      query
    )
  }

  getDetail(param?: SapiQueryParam): Observable<SapiSpaceModel>{
    return this.sapi.httpGet<SapiSpaceModel>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}`,
      null,
      param
    )
  }

  getVolumes(): Observable<SapiVolumeModel[]>{
    return this.sapi.httpGet<SapiVolumeModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/volumes`,
    )
  }
}