import { Pipe, PipeTransform } from "@angular/core";
import { SapiFeatureModel, SxplrCleanedFeatureModel, CLEANED_IEEG_DATASET_TYPE } from "src/atlasComponents/sapi";

@Pipe({
  name: 'featureBadgeName',
  pure: true
})

export class FeatureBadgeNamePipe implements PipeTransform{
  public transform(regionalFeature: SapiFeatureModel|SxplrCleanedFeatureModel) {
    if (regionalFeature['@type'] === "siibra/features/receptor") {
      return "receptor density"
    }
    if (regionalFeature["@type"] === CLEANED_IEEG_DATASET_TYPE) {
      return "IEEG dataset"
    }
    return null
  }
}
