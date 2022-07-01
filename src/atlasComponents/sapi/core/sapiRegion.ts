import { SAPI } from "..";
import { SapiRegionalFeatureModel, SapiRegionMapInfoModel, SapiRegionModel, cleanIeegSessionDatasets, SapiIeegSessionModel, CleanedIeegDataset, SapiVolumeModel, PaginatedResponse } from "../type";
import { strToRgb, hexToRgb } from 'common/util'
import { merge, Observable, of } from "rxjs";
import { catchError, map, scan } from "rxjs/operators";

export class SAPIRegion{

  static GetDisplayColor(region: SapiRegionModel): [number, number, number]{
    if (!region) {
      throw new Error(`region must be provided!`)
    }
    if (region.hasAnnotation?.displayColor) {
      return hexToRgb(region.hasAnnotation.displayColor)
    }
    return strToRgb(JSON.stringify(region))
  }

  private prefix: string

  constructor(
    private sapi: SAPI,
    public atlasId: string,
    public parcId: string,
    public id: string,
  ){
    this.prefix = `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.parcId)}/regions/${encodeURIComponent(this.id)}`
  }

  getFeatures(spaceId: string): Observable<(SapiRegionalFeatureModel | CleanedIeegDataset)[]> {
    return merge(
      this.sapi.httpGet<SapiRegionalFeatureModel[]>(
        `${this.prefix}/features`,
        {
          space_id: spaceId
        }
      ).pipe(
        catchError((err, obs) => {
          return of([])
        })
      ),
      spaceId
        ? this.sapi.getSpace(this.atlasId, spaceId).getFeatures({ parcellationId: this.parcId, region: this.id }).pipe(
          catchError((err, obs) => {
            return of([])
          }),
          map(feats => {
            const ieegSessions: SapiIeegSessionModel[] = feats.filter(feat => feat["@type"] === "siibra/features/ieegSession")
            return cleanIeegSessionDatasets(ieegSessions)
          }),
        )
        : of([] as CleanedIeegDataset[])
    ).pipe(
      scan((acc, curr) => [...acc, ...curr], [])
    )
  }

  getFeatureInstance(instanceId: string, spaceId: string = null): Observable<SapiRegionalFeatureModel> {
    return this.sapi.httpGet<SapiRegionalFeatureModel>(
      `${this.prefix}/features/${encodeURIComponent(instanceId)}`,
      {
        space_id: spaceId
      }
    )
  }

  getMapInfo(spaceId: string): Observable<SapiRegionMapInfoModel> {
    return this.sapi.http.get<SapiRegionMapInfoModel>(
      `${this.prefix}/regional_map/info`,
      {
        params: {
          space_id: spaceId
        }
      }
    )
  }

  getMapUrl(spaceId: string): string {
    return `${this.prefix}/regional_map/map?space_id=${encodeURI(spaceId)}`
  }

  getVolumes(): Observable<PaginatedResponse<SapiVolumeModel>>{
    const url = `${this.prefix}/volumes`
    return this.sapi.httpGet<PaginatedResponse<SapiVolumeModel>>(
      url
    )
  }

  getVolumeInstance(volumeId: string): Observable<SapiVolumeModel> {
    const url = `${this.prefix}/volumes/${encodeURIComponent(volumeId)}`
    return this.sapi.httpGet<SapiVolumeModel>(
      url
    )
  }

  getDetail(spaceId: string): Observable<SapiRegionModel> {
    const url = `${this.prefix}/${encodeURIComponent(this.id)}`
    return this.sapi.httpGet<SapiRegionModel>(
      url,
      {
        space_id: spaceId
      }
    )
  }
}
