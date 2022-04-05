import { SapiParcellationModel } from "src/atlasComponents/sapi";

export type ParcVolumeSpec = {
  volumeSrc: string
  labelIndicies: number[]
  parcellation: SapiParcellationModel
  laterality: 'left hemisphere' | 'right hemisphere' | 'whole brain'
}
