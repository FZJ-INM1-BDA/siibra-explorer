import { SAPI } from "..";
import { SapiRegionalFeatureModel } from "../type";

export class SAPIRegion{
  constructor(
    private sapi: SAPI,
    public atlasId: string,
    public parcId: string,
    public id: string,
  ){

  }

  getFeatures(spaceId: string): Promise<SapiRegionalFeatureModel[]> {
    return this.sapi.http.get<SapiRegionalFeatureModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.parcId)}/regions/${encodeURIComponent(this.id)}/features`,
      {
        params: {
          space_id: spaceId
        }
      }
    ).toPromise()
  }

  getFeatureInstance(instanceId: string, spaceId: string): Promise<SapiRegionalFeatureModel> {
    return this.sapi.http.get<SapiRegionalFeatureModel>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.parcId)}/regions/${encodeURIComponent(this.id)}/features/${encodeURIComponent(instanceId)}`,
      {
        params: {
          space_id: spaceId
        }
      }
    ).toPromise()
  }
}
