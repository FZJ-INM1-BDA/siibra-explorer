import {Component, EventEmitter, Input, Output} from "@angular/core";
import { SapiSpaceModel } from "src/atlasComponents/sapi/type";

@Component({
  selector: 'sxplr-sapiviews-core-space-chip',
  templateUrl: './space.chip.template.html'
})

export class SapiViewCoreSpaceChip {

  @Input('sxplr-sapiviews-core-space-chip-space')
  space: SapiSpaceModel

  @Input('sxplr-sapiviews-core-space-chip-color')
  color: 'default' | 'primary' | 'accent' | 'warn' = "default"

  @Output('sxplr-sapiviews-core-space-chip-onclick')
  onClick = new EventEmitter<MouseEvent>()

  click(event: MouseEvent) {
    this.onClick.emit(event)
  }

}
