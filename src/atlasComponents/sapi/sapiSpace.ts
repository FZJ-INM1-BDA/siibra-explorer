import { Observable } from "rxjs"
import { SAPI } from './sapi'
import { camelToSnake } from 'common/util'
import { IVolumeTypeDetail } from "src/util/siibraApiConstants/types"

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

type SapiVoiResponse = {
  "@id": string
  name: string
  description: string
  urls: {
    cite?: string
    doi: string
  }[]
  location: {
    space: {
      "@id": string
      center: Point
      minpoint: Point
      maxpoint: Point
    }
  }
  volumes: Volume[]
}

type SapiSpatialResp = SapiVoiResponse

export class SAPISpace{

  constructor(private sapi: SAPI, private atlasId: string, public id: string){}

  getModalities(): Observable<FeatureResponse> {
    return this.sapi.http.get<FeatureResponse>(
      `${this.sapi.bsEndpoint}/atlases/${this.atlasId}/spaces/${this.id}/features`
    )
  }

  getFeatures(modalityId: string, opts: SpatialFeatureOpts): Observable<SapiSpatialResp[]> {
    const query = {}
    for (const [key, value] of Object.entries(opts)) {
      query[camelToSnake(key)] = value
    }
    return this.sapi.http.get<SapiSpatialResp[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features/${encodeURIComponent(modalityId)}`,
      {
        params: query
      }
    )
  }
}
