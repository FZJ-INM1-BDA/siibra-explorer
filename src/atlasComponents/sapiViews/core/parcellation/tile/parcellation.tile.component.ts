import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi";
import { GroupedParcellation } from "../groupedParcellation";

const lightthemeId = [
  'juelich/iav/atlas/v1.0.0/3',
  'juelich/iav/atlas/v1.0.0/4',
]

@Component({
  selector: `sxplr-sapiviews-core-parcellation-tile`,
  templateUrl: './parcellation.tile.template.html',
  styleUrls: [
    `./parcellation.tile.style.css`
  ],
})

export class SapiViewsCoreParcellationParcellationTile implements OnChanges{
  @Input('sxplr-sapiviews-core-parcellation-tile-parcellation')
  parcellation: SapiParcellationModel | GroupedParcellation

  @Input('sxplr-sapiviews-core-parcellation-tile-selected')
  selected: boolean = false

  @Output('sxplr-sapiviews-core-parcellation-tile-onclick-parc')
  onClickOnParcellation = new EventEmitter<SapiParcellationModel>()

  public gutterSize = "2"
  public rowHeight = "6:11"

  public darktheme = false
  public pureParc: SapiParcellationModel
  public dirParc: GroupedParcellation

  ngOnChanges(): void {
    if (this.parcellation instanceof GroupedParcellation) {
      this.dirParc = this.parcellation
    } else {
      this.pureParc = this.parcellation
    }
    this.darktheme = !!this.dirParc || lightthemeId.indexOf(this.parcellation['@id']) < 0
  }

  clickOnParcellation(parc: SapiParcellationModel){
    this.onClickOnParcellation.emit(parc)
  }
}
