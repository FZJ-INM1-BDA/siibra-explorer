import {Component, EventEmitter, Input, Output} from "@angular/core";
import {SapiAtlasModel} from "src/atlasComponents/sapi/type";

@Component({
  selector: 'sxplr-sapiviews-core-atlas-chip',
  templateUrl: './atlas.chip.template.html'
})

export class SapiViewCoreAtlasChip {

  @Input('sxplr-sapiviews-core-atlas-chip-atlas')
  atlas: SapiAtlasModel

  @Input('sxplr-sapiviews-core-atlas-chip-color')
  color: 'default' | 'primary' | 'accent' | 'warn' = "default"

  @Output('sxplr-sapiviews-core-atlas-chip-onclick')
  onClick = new EventEmitter<MouseEvent>()

  click(event: MouseEvent) {
    this.onClick.emit(event)
  }

}
