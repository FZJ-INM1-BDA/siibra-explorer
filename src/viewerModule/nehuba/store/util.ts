import { SapiParcellationModel, SapiRegionModel } from "src/atlasComponents/sapi";

export type ParcVolumeSpec = {
  volumeSrc: string
  parcellation: SapiParcellationModel
  regions: {
    labelIndex: number
    region: SapiRegionModel
  }[]
}
