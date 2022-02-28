import { Pipe, PipeTransform } from "@angular/core";
import { SapiRegionalFeatureModel } from "src/atlasComponents/sapi";

@Pipe({
  name: 'regionalFeatureBadgeName',
  pure: true
})

export class RegionalFeatureBadgeColourName implements PipeTransform{
  public transform(regionalFeature: SapiRegionalFeatureModel) {
      if (regionalFeature.type === "siibra/receptor") {
        return "receptor density"
      }
      return null
  }
}
