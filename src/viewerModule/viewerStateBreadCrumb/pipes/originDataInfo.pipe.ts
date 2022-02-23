import { Pipe, PipeTransform } from "@angular/core"
import {
  SapiDatasetModel,
  SapiParcellationModel,
  SapiRegionModel,
} from "src/atlasComponents/sapi"

@Pipe({
  name: 'originDatainfoPipe'
})

export class OriginalDatainfoPipe implements PipeTransform{
  public transform(obj: SapiParcellationModel | SapiRegionModel): SapiDatasetModel[]{
    
    if (obj["@type"] === "minds/core/parcellationatlas/v1.0.0") {
      const ds = (obj as SapiParcellationModel).datasets[0]
      return (obj as SapiParcellationModel).datasets
    }
    if (obj["@type"] === "https://openminds.ebrains.eu/sands/ParcellationEntityVersion") {
      (obj as SapiRegionModel)
      return []
    }
  }
}
