import { Observable } from "rxjs"
import { SAPI } from '../sapi.service'
import { camelToSnake } from 'common/util'
import { IVolumeTypeDetail } from "src/util/siibraApiConstants/types"
import { SapiQueryParam, SapiSpaceModel, SapiSpatialFeatureModel, SapiVolumeModel } from "../type"
import { tap } from "rxjs/operators"

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


type Point = [number, number, number]
type Volume = {
  id: string
  name: string
  url: string
  volume_type: "neuroglancer/precomputed"
  detail: {
    "neuroglancer/precomputed": IVolumeTypeDetail["neuroglancer/precomputed"]
  }
}

export class SAPISpace{

  constructor(private sapi: SAPI, public atlasId: string, public id: string){}

  getModalities(param?: SapiQueryParam): Observable<FeatureResponse> {
    return this.sapi.httpGet<FeatureResponse>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features`,
      null,
      param
    )
  }

  getFeatures(modalityId: string, opts: SpatialFeatureOpts): Promise<SapiSpatialFeatureModel[]> {
    const query = {}
    for (const [key, value] of Object.entries(opts)) {
      query[camelToSnake(key)] = value
    }
    return this.sapi.cachedGet<SapiSpatialFeatureModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features/${encodeURIComponent(modalityId)}`,
      {
        params: query
      }
    )
  }

  getDetail(param?: SapiQueryParam): Observable<SapiSpaceModel>{
    return this.sapi.httpGet<SapiSpaceModel>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}`,
      null,
      param
    )
  }

  getVolumes(): Promise<SapiVolumeModel[]>{
    return this.sapi.cachedGet<SapiVolumeModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/volumes`,
    )
  }
}
