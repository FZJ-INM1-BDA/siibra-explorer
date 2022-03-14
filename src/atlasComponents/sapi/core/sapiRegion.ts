import { SAPI } from "..";
import { SapiRegionalFeatureModel, SapiRegionMapInfoModel, SapiRegionModel } from "../type";
import { strToRgb, hexToRgb } from 'common/util'

export class SAPIRegion{

  static GetDisplayColor(region: SapiRegionModel){
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

  getFeatures(spaceId: string): Promise<SapiRegionalFeatureModel[]> {
    return this.sapi.http.get<SapiRegionalFeatureModel[]>(
      `${this.prefix}/features`,
      {
        params: {
          space_id: spaceId
        }
      }
    ).toPromise()
  }

  getFeatureInstance(instanceId: string, spaceId: string = null): Promise<SapiRegionalFeatureModel> {
    return this.sapi.http.get<SapiRegionalFeatureModel>(
      `${this.prefix}/features/${encodeURIComponent(instanceId)}`,
      {
        params: {
          space_id: spaceId
        }
      }
    ).toPromise()
  }

  getMapInfo(spaceId: string): Promise<SapiRegionMapInfoModel> {
    return this.sapi.http.get<SapiRegionMapInfoModel>(
      `${this.prefix}/regional_map/info`,
      {
        params: {
          space_id: spaceId
        }
      }
    ).toPromise()
  }

  getMapUrl(spaceId: string): string {
    return `${this.prefix}/regional_map/map?space_id=${encodeURI(spaceId)}`
  }

  getDetail(spaceId: string): Promise<SapiRegionModel> {
    return this.sapi.http.get<SapiRegionModel>(
      `${this.prefix}/${this.id}`,
      {
        params: {
          space_id: spaceId
        }
      }
    ).toPromise()
  }
}
