import { Component, Input } from "@angular/core";
import { SapiFeatureModel, SapiRegionalFeatureModel, SapiSpatialFeatureModel, SapiParcellationFeatureModel } from "src/atlasComponents/sapi";
import { CleanedIeegDataset, CLEANED_IEEG_DATASET_TYPE, SapiDatasetModel, SapiParcellationFeatureMatrixModel, SapiRegionalFeatureReceptorModel, SapiSerializationErrorModel, SapiVOIDataResponse, SxplrCleanedFeatureModel } from "src/atlasComponents/sapi/type";

@Component({
  selector: `sxplr-sapiviews-features-entry-list-item`,
  templateUrl: `./entryListItem.template.html`,
  styleUrls: [
    `./entryListItem.style.css`
  ]
})

export class SapiViewsFeaturesEntryListItem{
  @Input('sxplr-sapiviews-features-entry-list-item-feature')
  feature: SapiFeatureModel | SxplrCleanedFeatureModel

  @Input('sxplr-sapiviews-features-entry-list-item-ripple')
  ripple = true

  get label(): string{
    if (!this.feature) return null
    const { '@type': type } = this.feature
    if (
      type === "siibra/core/dataset" ||
      type === "siibra/features/receptor" ||
      type === "siibra/features/voi" ||
      type === CLEANED_IEEG_DATASET_TYPE
    ) {
      return (this.feature as (SapiDatasetModel | SapiRegionalFeatureReceptorModel | SapiVOIDataResponse | CleanedIeegDataset) ).metadata.fullName
    }

    if (
      type === "siibra/features/connectivity" ||
      type === "siibra/features/connectivity/streamlineCounts"
    ) {
      return (this.feature as SapiParcellationFeatureMatrixModel).name
    }
    if (type === "spy/serialization-error") {
      return (this.feature as SapiSerializationErrorModel).message
    }
    return "Unknown type"
  }
}
