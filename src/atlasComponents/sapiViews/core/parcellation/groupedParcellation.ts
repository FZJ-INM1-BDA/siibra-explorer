import { SapiParcellationModel } from "src/atlasComponents/sapi"

export class GroupedParcellation{
  name: string
  parcellations: SapiParcellationModel[]
  constructor(name: string, parcellations: SapiParcellationModel[]){
    this.name = name
    this.parcellations = parcellations
  }
}
