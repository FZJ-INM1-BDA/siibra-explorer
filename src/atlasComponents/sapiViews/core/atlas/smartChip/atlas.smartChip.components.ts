import {Component, EventEmitter, Input, Output} from "@angular/core";
import {SapiAtlasModel} from "src/atlasComponents/sapi";

@Component({
  selector: 'sxplr-sapiviews-core-atlas-smartchip',
  templateUrl: './atlas.smartChip.template.html',
  styleUrls: ['./atlas.smartChip.style.css']
})

export class SapiViewCoreAtlasSmartChip {

  @Input('sxplr-sapiviews-core-atlas-smartchip-atlas')
  atlas: SapiAtlasModel

  @Input('sxplr-sapiviews-core-atlas-smartchip-all-atlases')
  atlases: SapiAtlasModel[]

  @Output('sxplr-sapiviews-core-atlas-smartchip-select-atlas')
  onSelectAtlas = new EventEmitter<SapiAtlasModel>()

  // constructor() {}


  selectAtlas(atlas: SapiAtlasModel){
    if (this.trackByFn(atlas) === this.trackByFn(this.atlas)) return
    this.onSelectAtlas.emit(atlas)
  }

  trackByFn(atlas: SapiAtlasModel){
    return atlas["@id"]
  }

}
