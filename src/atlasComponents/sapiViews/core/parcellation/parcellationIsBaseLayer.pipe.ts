import { Pipe, PipeTransform } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";

const baseLayerIds = [
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290",
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-25",
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579",
]

@Pipe({
  name: 'parcellationIsBaseLayer',
  pure: true
})

export class ParcellationIsBaseLayer implements PipeTransform{
  public transform(parc: SapiParcellationModel): boolean {
    /**
     * currently, the only base layer is cyto maps
     */
    return baseLayerIds.includes(parc["@id"])
  }
}
