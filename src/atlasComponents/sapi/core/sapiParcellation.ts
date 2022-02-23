import { SapiVolumeModel } from ".."
import { SAPI } from "../sapi.service"
import { SapiParcellationModel, SapiRegionModel } from "../type"

export class SAPIParcellation{
  constructor(private sapi: SAPI, public atlasId: string, public id: string){

  }
  getDetail(): Promise<SapiParcellationModel>{
    return this.sapi.cachedGet<SapiParcellationModel>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}`
    )
  }
  getRegions(spaceId: string): Promise<SapiRegionModel[]> {
    return this.sapi.cachedGet<SapiRegionModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/regions`,
      {
        params: {
          space_id: spaceId
        }
      }
    )
  }
  getVolumes(): Promise<SapiVolumeModel[]>{
    return this.sapi.cachedGet<SapiVolumeModel[]>(
      `${this.sapi.bsEndpoint}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.id)}/volumes`
    )
  }
}
