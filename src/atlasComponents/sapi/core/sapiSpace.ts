import { Observable } from "rxjs"
import { SAPI } from '../sapi.service'
import { camelToSnake } from 'common/util'
import {SapiQueryPriorityArg, SapiSpaceModel, SapiSpatialFeatureModel, SapiVolumeModel} from "../type"
import { map, switchMap } from "rxjs/operators"

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

  constructor(private sapi: SAPI, public atlasId: string, public id: string){
    this.prefix$ = SAPI.BsEndpoint$.pipe(
      map(endpt => `${endpt}/atlases/${encodeURIComponent(this.atlasId)}/spaces/${encodeURIComponent(this.id)}`)
    )
  }

  private prefix$: Observable<string>

  getModalities(param?: SapiQueryPriorityArg): Observable<FeatureResponse> {
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<FeatureResponse>(
        `${prefix}/features`,
        null,
        param
      ))
    )
  }

  getFeatures(opts: SpatialFeatureOpts): Observable<SapiSpatialFeatureModel[]> {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(opts)) {
      query[camelToSnake(key)] = value
    }
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<SapiSpatialFeatureModel[]>(
        `${prefix}/features`,
        query
      ))
    )
  }

  getFeatureInstance(instanceId: string, opts: SpatialFeatureOpts): Observable<SapiSpatialFeatureModel> {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(opts)) {
      query[camelToSnake(key)] = value
    }
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<SapiSpatialFeatureModel>(
        `${prefix}/features/${encodeURIComponent(instanceId)}`,
        query
      ))
    )
  }

  getDetail(param?: SapiQueryPriorityArg): Observable<SapiSpaceModel>{
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<SapiSpaceModel>(
        `${prefix}`,
        null,
        param
      ))
    )
  }

  getVolumes(): Observable<SapiVolumeModel[]>{
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<SapiVolumeModel[]>(
        `${prefix}/volumes`,
      ))
    )
  }
}
