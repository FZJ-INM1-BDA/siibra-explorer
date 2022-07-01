import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { SapiDatasetModel } from "src/atlasComponents/sapi";
import { CONST } from "common/constants"

const RESTRICTED_ACCESS_ID = "https://nexus.humanbrainproject.org/v0/data/minds/core/embargostatus/v1.0.0/3054f80d-96a8-4dce-9b92-55c68a8b5efd"

@Component({
  selector: `sxplr-sapiviews-core-datasets-dataset`,
  templateUrl: './dataset.template.html',
  styleUrls: [
    `./dataset.style.css`
  ]
})

export class DatasetView implements OnChanges{
  @Input('sxplr-sapiviews-core-datasets-dataset-input')
  dataset: SapiDatasetModel

  public isRestricted = false
  public CONST = CONST

  ngOnChanges(changes: SimpleChanges): void {
    const { dataset } = changes
    if (dataset) {
      this.isRestricted = (dataset.currentValue as SapiDatasetModel)?.metadata?.accessibility?.["@id"] === RESTRICTED_ACCESS_ID
    }
  }
}
