import { Observable } from "rxjs"
import { SAPI } from '../sapi.service'
import { camelToSnake } from 'common/util'
import {SapiQueryPriorityArg, SapiSpaceModel, SapiSpatialFeatureModel, SapiVolumeModel} from "../type"

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

  getModalities(param?: SapiQueryPriorityArg): Observable<FeatureResponse> {
    return this.sapi.httpGet<FeatureResponse>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features`,
      null,
      param
    )
  }

  getFeatures(opts: SpatialFeatureOpts): Observable<SapiSpatialFeatureModel[]> {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(opts)) {
      query[camelToSnake(key)] = value
    }
    return this.sapi.httpGet<SapiSpatialFeatureModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features`,
      query
    )
  }

  getFeatureInstance(instanceId: string, opts: SpatialFeatureOpts): Observable<SapiSpatialFeatureModel> {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(opts)) {
      query[camelToSnake(key)] = value
    }
    return this.sapi.httpGet<SapiSpatialFeatureModel>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features/${encodeURIComponent(instanceId)}`,
      query
    )
  }

  getDetail(param?: SapiQueryPriorityArg): Observable<SapiSpaceModel>{
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
