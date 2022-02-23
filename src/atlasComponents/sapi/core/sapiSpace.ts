import { Observable } from "rxjs"
import { SAPI } from '../sapi.service'
import { camelToSnake } from 'common/util'
import { IVolumeTypeDetail } from "src/util/siibraApiConstants/types"
import { SapiSpaceModel, SapiSpatialFeatureModel, SapiVolumeModel } from "../type"

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

  getModalities(): Observable<FeatureResponse> {
    return this.sapi.http.get<FeatureResponse>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/features`
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

  getDetail(): Promise<SapiSpaceModel>{
    return this.sapi.cachedGet<SapiSpaceModel>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}`,
    )
  }

  getVolumes(): Promise<SapiVolumeModel[]>{
    return this.sapi.cachedGet<SapiVolumeModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}/volumes`,
    )
  }
}
