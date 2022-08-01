import { Observable } from "rxjs"
import { switchMap } from "rxjs/operators"
import { SapiVolumeModel } from ".."
import { SAPI } from "../sapi.service"
import {SapiParcellationFeatureModel, SapiParcellationModel, SapiQueryPriorityArg, SapiRegionModel} from "../type"

type PaginationQuery = {
  size: number
  page: number
}

type ParcellationPaginationQuery = {
  type?: string
  size?: number
  page: number
}

export class SAPIParcellation{
  constructor(private sapi: SAPI, public atlasId: string, public id: string){

  }

  getDetail(queryParam?: SapiQueryPriorityArg): Observable<SapiParcellationModel>{
    return SAPI.BsEndpoint$.pipe(
      switchMap(endpt => this.sapi.httpGet<SapiParcellationModel>(
        `${endpt}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}`,
        null,
        queryParam
      ))
    )
  }

  getRegions(spaceId: string, queryParam?: SapiQueryPriorityArg): Observable<SapiRegionModel[]> {
    return SAPI.BsEndpoint$.pipe(
      switchMap(endpt => this.sapi.httpGet<SapiRegionModel[]>(
        `${endpt}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/regions`,
        {
          space_id: spaceId
        },
        queryParam
      ))
    )
  }
  getVolumes(): Observable<SapiVolumeModel[]>{
    return SAPI.BsEndpoint$.pipe(
      switchMap(endpt => this.sapi.httpGet<SapiVolumeModel[]>(
        `${endpt}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/volumes`
      ))
    ) 
  }

  getFeatures(parcPagination?: ParcellationPaginationQuery, queryParam?: SapiQueryPriorityArg): Observable<SapiParcellationFeatureModel[]> {
    return SAPI.BsEndpoint$.pipe(
      switchMap(endpt => this.sapi.httpGet<SapiParcellationFeatureModel[]>(
        `${endpt}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/features`,
        {
          type: parcPagination?.type,
          size: parcPagination?.size?.toString() || '5',
          page: parcPagination?.page.toString() || '0',
        },
        queryParam
      ))
    )
  }

  getFeatureInstance(instanceId: string): Observable<SapiParcellationFeatureModel> {
    return SAPI.BsEndpoint$.pipe(
      switchMap(endpt => this.sapi.http.get<SapiParcellationFeatureModel>(
        `${endpt}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/features/${encodeURIComponent(instanceId)}`,
      ))
    )
  }
}
