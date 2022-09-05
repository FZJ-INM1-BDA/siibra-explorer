import {Component, EventEmitter, Input, Output} from "@angular/core";
import { SapiSpaceModel } from "src/atlasComponents/sapi/type";

@Component({
  selector: 'sxplr-sapiviews-core-space-smartchip',
  templateUrl: './space.smartChip.template.html',
  styleUrls: ['./space.smartChip.style.css']
})

export class SapiViewCoreSpaceSmartChip {

  @Input('sxplr-sapiviews-core-space-smartchip-space')
  space: SapiSpaceModel

  @Input('sxplr-sapiviews-core-space-smartchip-all-spaces')
  spaces: SapiSpaceModel[]

  @Output('sxplr-sapiviews-core-space-smartchip-select-space')
  onSelectSpace = new EventEmitter<SapiSpaceModel>()

  // constructor() {}


  selectSpace(space: SapiSpaceModel){
    if (this.trackByFn(space) === this.trackByFn(this.space)) return
    this.onSelectSpace.emit(space)
  }

  trackByFn(space: SapiSpaceModel){
    return space["@id"]
  }

}
