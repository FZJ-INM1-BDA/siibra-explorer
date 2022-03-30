import { SAPI } from "..";
import { SapiRegionalFeatureModel, SapiRegionMapInfoModel, SapiRegionModel, cleanIeegSessionDatasets, SapiIeegSessionModel, CleanedIeegDataset } from "../type";
import { strToRgb, hexToRgb } from 'common/util'
import { forkJoin, Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";

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
    return forkJoin({
      regionalFeatures: this.sapi.httpGet<SapiRegionalFeatureModel[]>(
        `${this.prefix}/features`,
        {
          space_id: spaceId
        }
      ).pipe(
        catchError((err, obs) => of([]))
      ),
      spatialFeatures: spaceId
        ? this.sapi.getSpace(this.atlasId, spaceId).getFeatures({ parcellationId: this.parcId, region: this.id }).pipe(
          catchError((err, obs) => {
            console.log('error caught')
            return of([])
          }),
          map(feats => {
            const ieegSessions: SapiIeegSessionModel[] = feats.filter(feat => feat["@type"] === "siibra/features/ieegSession")
            return cleanIeegSessionDatasets(ieegSessions)
          }),
        )
        : of([] as CleanedIeegDataset[])
    }).pipe(
      map(({ regionalFeatures, spatialFeatures }) => {
        return [...spatialFeatures, ...regionalFeatures]
      })
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
