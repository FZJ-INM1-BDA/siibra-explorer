import { Pipe, PipeTransform } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";

const baseLayerIds = [
  /**
   * julich brain
   */
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290",
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-25",
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579",

  /**
   * allen mouse
   */
  "minds/core/parcellationatlas/v1.0.0/05655b58-3b6f-49db-b285-64b5a0276f83",
  "minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f",

  /**
   * waxholm
   */
  "minds/core/parcellationatlas/v1.0.0/11017b35-7056-4593-baad-3934d211daba",
  "minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d",
  "minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe",
  "minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe-v4",

  /**
   * monkey
   */
  "minds/core/parcellationatlas/v1.0.0/mebrains-tmp-id",
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
