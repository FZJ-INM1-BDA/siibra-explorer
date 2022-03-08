import { Pipe, PipeTransform } from "@angular/core";
import { SapiFeatureModel } from "src/atlasComponents/sapi";

@Pipe({
  name: 'featureBadgeName',
  pure: true
})

export class FeatureBadgeNamePipe implements PipeTransform{
  public transform(regionalFeature: SapiFeatureModel) {
      if (regionalFeature.type === "siibra/receptor") {
        return "receptor density"
      }
      return null
  }
}
