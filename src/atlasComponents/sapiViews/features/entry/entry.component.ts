import { Component, Input } from "@angular/core";
import { SapiFeatureModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";

@Component({
  selector: 'sxplr-sapiviews-features-entry',
  templateUrl: './entry.template.html',
  styleUrls: [
    './entry.style.css'
  ]
})

export class FeatureEntryCmp{

  /**
   * in future, hopefully feature detail can be queried with just id,
   * and atlas/space/parcellation/region are no longer necessary
   */
  @Input('sxplr-sapiviews-features-entry-atlas')
  atlas: SapiFeatureModel

  @Input('sxplr-sapiviews-features-entry-space')
  space: SapiSpaceModel

  @Input('sxplr-sapiviews-features-entry-parcellation')
  parcellation: SapiParcellationModel

  @Input('sxplr-sapiviews-features-entry-region')
  region: SapiRegionModel

  @Input('sxplr-sapiviews-features-entry-feature')
  feature: SapiFeatureModel

  featureType = {
    receptor: "siibra/receptor"
  }
}
