import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Feature } from "src/atlasComponents/sapi/type_sxplr";
import { CONST } from "common/constants"
import { translateV3Entities } from "src/atlasComponents/sapi/translate_v3"

const RESTRICTED_ACCESS_ID = "https://nexus.humanbrainproject.org/v0/data/minds/core/embargostatus/v1.0.0/3054f80d-96a8-4dce-9b92-55c68a8b5efd"

@Component({
  selector: `sxplr-sapiviews-core-datasets-dataset`,
  templateUrl: './dataset.template.html',
  styleUrls: [
    `./dataset.style.css`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DatasetView implements OnChanges{
  @Input('sxplr-sapiviews-core-datasets-dataset-input')
  dataset: Feature

  public isRestricted = false
  public CONST = CONST

  ngOnChanges(changes: SimpleChanges): void {
    const { dataset } = changes
    if (dataset) {
      throw new Error(`Fix this`)
      // this.isRestricted = (dataset.currentValue as Feature)?.metadata?.accessibility?.["@id"] === RESTRICTED_ACCESS_ID
    }
  }
}
