import { Component, Input } from "@angular/core";
import { SapiDatasetModel } from "src/atlasComponents/sapi";

@Component({
  selector: `sxplr-sapiviews-core-datasets-dataset`,
  templateUrl: './dataset.template.html',
  styleUrls: [
    `./dataset.style.css`
  ]
})

export class DatasetView {
  @Input('sxplr-sapiviews-core-datasets-dataset-input')
  dataset: SapiDatasetModel
}
