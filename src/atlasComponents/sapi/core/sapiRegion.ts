import { SAPI } from "..";
import { SapiRegionalFeatureModel, SapiRegionMapInfoModel, SapiRegionModel, cleanIeegSessionDatasets, SapiIeegSessionModel, CleanedIeegDataset, SapiVolumeModel, PaginatedResponse } from "../type";
import { strToRgb, hexToRgb } from 'common/util'
import { merge, Observable, of } from "rxjs";
import { catchError, map, scan, switchMap } from "rxjs/operators";

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

  private prefix$: Observable<string>

  constructor(
    private sapi: SAPI,
    public atlasId: string,
    public parcId: string,
    public id: string,
  ){
    this.prefix$ = SAPI.BsEndpoint$.pipe(
      map(endpt => `${endpt}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.parcId)}/regions/${encodeURIComponent(this.id)}`)
    )
  }

  getFeatures(spaceId: string): Observable<(SapiRegionalFeatureModel | CleanedIeegDataset)[]> {
    return merge(
      this.prefix$.pipe(
        switchMap(prefix => 
          this.sapi.httpGet<SapiRegionalFeatureModel[]>(
            `${prefix}/features`,
            {
              space_id: spaceId
            }
          ).pipe(
            catchError((err, obs) => {
              return of([])
            })
          )
        )
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
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<SapiRegionalFeatureModel>(
        `${prefix}/features/${encodeURIComponent(instanceId)}`,
        {
          space_id: spaceId
        }
      ))
    )
  }

  getMapInfo(spaceId: string): Observable<SapiRegionMapInfoModel> {
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.http.get<SapiRegionMapInfoModel>(
        `${prefix}/regional_map/info`,
        {
          params: {
            space_id: spaceId
          }
        }
      ))
    )
  }

  getMapUrl(spaceId: string): Observable<string> {
    return this.prefix$.pipe(
      map(prefix => `${prefix}/regional_map/map?space_id=${encodeURI(spaceId)}`)
    )
  }

  getVolumes(): Observable<PaginatedResponse<SapiVolumeModel>>{
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<PaginatedResponse<SapiVolumeModel>>(
        `${prefix}/volumes`
      ))
    )
  }

  getVolumeInstance(volumeId: string): Observable<SapiVolumeModel> {
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<SapiVolumeModel>(
        `${prefix}/volumes/${encodeURIComponent(volumeId)}`
      ))
    )
  }

  getDetail(spaceId: string): Observable<SapiRegionModel> {
    return this.prefix$.pipe(
      switchMap(prefix => this.sapi.httpGet<SapiRegionModel>(
        prefix,
        {
          space_id: spaceId
        }
      ))
    )
  }
}
