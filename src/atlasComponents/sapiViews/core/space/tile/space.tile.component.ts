import { Component, Input } from "@angular/core";
import { SapiSpaceModel } from "src/atlasComponents/sapi";

@Component({
  selector: `sxplr-sapiviews-core-space-tile`,
  templateUrl: `./space.tile.template.html`,
  styleUrls: [
    `./space.tile.style.css`
  ]
})

export class SapiViewsCoreSpaceSpaceTile {
  @Input('sxplr-sapiviews-core-space-tile-space')
  space: SapiSpaceModel

  @Input('sxplr-sapiviews-core-space-tile-selected')
  selected: boolean = false

}