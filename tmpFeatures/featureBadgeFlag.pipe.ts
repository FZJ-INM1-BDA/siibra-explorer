import { Pipe, PipeTransform } from "@angular/core";
import { SapiFeatureModel, SxplrCleanedFeatureModel, CLEANED_IEEG_DATASET_TYPE } from "src/atlasComponents/sapi";

@Pipe({
  name: 'featureBadgeFlag',
  pure: true
})

export class FeatureBadgeFlagPipe implements PipeTransform{
  public transform(regionalFeature: SapiFeatureModel|SxplrCleanedFeatureModel) {
    return regionalFeature['@type'] === "siibra/features/receptor"
      || regionalFeature['@type'] === CLEANED_IEEG_DATASET_TYPE
  }
}
