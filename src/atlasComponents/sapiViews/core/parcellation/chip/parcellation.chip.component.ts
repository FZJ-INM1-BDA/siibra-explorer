import { Component, Input, Output, EventEmitter } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";

@Component({
  selector: `sxplr-sapiviews-core-parcellation-chip`,
  templateUrl: './parcellation.chip.template.html',
  styleUrls: [
    `./parcellation.chip.style.css`
  ],
})

export class SapiViewsCoreParcellationParcellationChip {

  @Input('sxplr-sapiviews-core-parcellation-chip-parcellation')
  parcellation: SapiParcellationModel

  @Input('sxplr-sapiviews-core-parcellation-chip-color')
  color: 'default' | 'primary' | 'accent' | 'warn' = "default"

  @Input('sxplr-sapiviews-core-parcellation-chip-custom-class')
  customClass: string = ''

  @Input('sxplr-sapiviews-core-parcellation-chip-custom-color')
  customColor: string

  @Output('sxplr-sapiviews-core-parcellation-chip-onclick')
  onClick = new EventEmitter<MouseEvent>()

  click(event: MouseEvent) {
    this.onClick.emit(event)
  }
}
