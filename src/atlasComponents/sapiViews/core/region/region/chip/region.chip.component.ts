import { Component, EventEmitter, Output } from "@angular/core";
import { SapiViewsCoreRegionRegionBase } from "../region.base.directive";

@Component({
  selector: `sxplr-sapiviews-core-region-region-chip`,
  templateUrl: `./region.chip.template.html`,
  styleUrls: [
    `./region.chip.style.css`
  ]
})

export class SapiViewsCoreRegionRegionChip extends SapiViewsCoreRegionRegionBase {
  shouldFetchDetail = true
  @Output('sxplr-sapiviews-core-region-region-chip-clicked')
  clickEmitter = new EventEmitter<MouseEvent>()

  onClick(event: MouseEvent){
    this.clickEmitter.emit(event)
  }
}
