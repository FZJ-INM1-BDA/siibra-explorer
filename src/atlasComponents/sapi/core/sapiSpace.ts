import { Observable, of, throwError } from "rxjs"
import { SAPI } from '../sapi.service'
import { SxplrTemplate, SapiQueryPriorityArg } from "../sxplrTypes"
import { map, switchMap } from "rxjs/operators"
import { SAPIBase } from "./base"

/**
 * All valid parcellation features
 */
const SpaceFeatures = {
  Image: "Image",
} as const

export type SF = keyof typeof SpaceFeatures

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

export class SAPISpace extends SAPIBase<SF>{

  static Features$ = of(Object.keys(SpaceFeatures) as SF[])
  public features$ = SAPISpace.Features$

  constructor(private sapi: SAPI, public atlasId: string, public id: string){
    super(sapi)
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

  getDetail(param?: SapiQueryPriorityArg): Observable<SxplrTemplate>{
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<SxplrTemplate>(
        `${prefix}`,
        null,
        param
      ))
    )
  }

}
