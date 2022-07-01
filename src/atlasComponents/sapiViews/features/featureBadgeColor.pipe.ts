import { Pipe, PipeTransform } from "@angular/core";
import { SapiFeatureModel, SxplrCleanedFeatureModel, CLEANED_IEEG_DATASET_TYPE } from "src/atlasComponents/sapi";

@Pipe({
  name: 'featureBadgeColour',
  pure: true
})

export class FeatureBadgeColourPipe implements PipeTransform{
  public transform(regionalFeature: SapiFeatureModel|SxplrCleanedFeatureModel) {
    if (regionalFeature['@type'] === "siibra/features/receptor") {
      return "accent"
    }
    if (regionalFeature['@type'] === CLEANED_IEEG_DATASET_TYPE) {
      return "primary"
    }
    return "default"
  }
}
