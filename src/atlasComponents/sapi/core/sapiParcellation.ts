import { Observable } from "rxjs"
import { SapiVolumeModel } from ".."
import { SAPI } from "../sapi.service"
import { SapiParcellationFeatureModel, SapiParcellationModel, SapiQueryParam, SapiRegionModel } from "../type"

type PaginationQuery = {
  size: number
  page: number
}

type ParcellationPaginationQuery = {
  type?: string
}

export class SAPIParcellation{
  constructor(private sapi: SAPI, public atlasId: string, public id: string){

  }

  getDetail(queryParam?: SapiQueryParam): Observable<SapiParcellationModel>{
    return this.sapi.httpGet<SapiParcellationModel>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}`,
      null,
      queryParam
    )
  }

  getRegions(spaceId: string, queryParam?: SapiQueryParam): Observable<SapiRegionModel[]> {
    return this.sapi.httpGet<SapiRegionModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/regions`,
      {
        space_id: spaceId
      },
      queryParam
    )
  }
  getVolumes(): Observable<SapiVolumeModel[]>{
    return this.sapi.httpGet<SapiVolumeModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/volumes`
    )
  }

  getFeatures(param?: PaginationQuery, parcPagination?: ParcellationPaginationQuery, queryParam?: SapiQueryParam): Observable<SapiParcellationFeatureModel[]> {
    return this.sapi.httpGet<SapiParcellationFeatureModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/features`,
      {
        type: parcPagination?.type,
        size: param?.size?.toString() || '5',
        page: param?.page?.toString() || '0',
      },
      queryParam
    )
  }

  getFeatureInstance(instanceId: string): Observable<SapiParcellationFeatureModel> {
    return this.sapi.http.get<SapiParcellationFeatureModel>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/features/${encodeURIComponent(instanceId)}`,
    )
  }
}
