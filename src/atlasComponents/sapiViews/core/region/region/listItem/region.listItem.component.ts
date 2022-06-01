import { Component, Input } from "@angular/core";
import { SapiViewsCoreRegionRegionBase } from "../region.base.directive";

@Component({
  selector: 'sxplr-sapiviews-core-region-region-list-item',
  templateUrl: './region.listItem.template.html',
  styleUrls: [
    `./region.listItem.style.css`
  ]
})

export class SapiViewsCoreRegionRegionListItem extends SapiViewsCoreRegionRegionBase {
  @Input('sxplr-sapiviews-core-region-region-list-item-ripple')
  ripple: boolean = false
}