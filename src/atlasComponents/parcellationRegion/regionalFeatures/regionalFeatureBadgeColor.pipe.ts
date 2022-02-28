import { Pipe, PipeTransform } from "@angular/core";
import { SapiRegionalFeatureModel } from "src/atlasComponents/sapi";

@Pipe({
  name: 'regionalFeatureBadgeColour',
  pure: true
})

export class RegionalFeatureBadgeColourPipe implements PipeTransform{
  public transform(regionalFeature: SapiRegionalFeatureModel) {
      if (regionalFeature.type === "siibra/receptor") {
        return "accent"
      }
      return "default"
  }
}
