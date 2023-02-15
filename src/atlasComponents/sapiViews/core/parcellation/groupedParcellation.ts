import { SxplrParcellation } from "src/atlasComponents/sapi/type_sxplr"

export class GroupedParcellation{
  name: string
  parcellations: SxplrParcellation[]
  constructor(name: string, parcellations: SxplrParcellation[]){
    this.name = name
    this.parcellations = parcellations
  }
}
