import { Pipe, PipeTransform } from "@angular/core";
import { SapiFeatureModel } from "src/atlasComponents/sapi";

@Pipe({
  name: 'featureBadgeColour',
  pure: true
})

export class FeatureBadgeColourPipe implements PipeTransform{
  public transform(regionalFeature: SapiFeatureModel) {
      if (regionalFeature.type === "siibra/receptor") {
        return "accent"
      }
      return "default"
  }
}
