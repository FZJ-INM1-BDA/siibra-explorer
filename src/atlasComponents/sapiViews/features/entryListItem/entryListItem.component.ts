import { Component, Input } from "@angular/core";
import { SapiFeatureModel, SapiRegionalFeatureModel, SapiSpatialFeatureModel, SapiParcellationFeatureModel } from "src/atlasComponents/sapi";
import { SapiParcellationFeatureMatrixModel } from "src/atlasComponents/sapi/type";

@Component({
  selector: `sxplr-sapiviews-features-entry-list-item`,
  templateUrl: `./entryListItem.template.html`,
  styleUrls: [
    `./entryListItem.style.css`
  ]
})

export class SapiViewsFeaturesEntryListItem{
  @Input('sxplr-sapiviews-features-entry-list-item-feature')
  feature: SapiFeatureModel

  @Input('sxplr-sapiviews-features-entry-list-item-ripple')
  ripple = true

  get label(): string{
    if (!this.feature) return null
    if (this.feature.type === "siibra/base-dataset" || this.feature.type === "siibra/receptor") {
      return (this.feature as (SapiRegionalFeatureModel | SapiSpatialFeatureModel)).metadata.fullName
    }
    return (this.feature as SapiParcellationFeatureMatrixModel).name
  }
  constructor(){
  }
}
