import {Component, EventEmitter, HostListener, Input, Output, Renderer2} from "@angular/core";
import { SapiSpaceModel } from "src/atlasComponents/sapi/type";
import {Renderer} from "@angular/compiler-cli/ngcc/src/rendering/renderer";

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

  @Input('sxplr-sapiviews-core-space-smartchip-custom-color')
  customColor: string

  @Output('sxplr-sapiviews-core-space-smartchip-select-space')
  onSelectSpace = new EventEmitter<SapiSpaceModel>()



  selectSpace(space: SapiSpaceModel){
    if (this.trackByFn(space) === this.trackByFn(this.space)) return
    this.onSelectSpace.emit(space)
  }

  trackByFn(space: SapiSpaceModel){
    return space["@id"]
  }

}
