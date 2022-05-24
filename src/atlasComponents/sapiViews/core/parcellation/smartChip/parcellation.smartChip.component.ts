import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Observable } from "rxjs";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";
import { ParcellationVisibilityService } from "../parcellationVis.service";
import { ARIA_LABELS } from "common/constants"
import { getTraverseFunctions } from "../parcellationVersion.pipe";

@Component({
  selector: `sxplr-sapiviews-core-parcellation-smartchip`,
  templateUrl: `./parcellation.smartChip.template.html`,
  styleUrls: [
    `./parcellation.smartChip.style.css`
  ]
})

export class SapiViewsCoreParcellationParcellationSmartChip implements OnChanges{

  public ARIA_LABELS = ARIA_LABELS

  @Input('sxplr-sapiviews-core-parcellation-smartchip-parcellation')
  parcellation: SapiParcellationModel

  @Input('sxplr-sapiviews-core-parcellation-smartchip-all-parcellations')
  parcellations: SapiParcellationModel[]

  @Output('sxplr-sapiviews-core-parcellation-smartchip-dismiss-nonbase-layer')
  onDismiss = new EventEmitter<SapiParcellationModel>()

  @Output('sxplr-sapiviews-core-parcellation-smartchip-select-parcellation')
  onSelectParcellation = new EventEmitter<SapiParcellationModel>()

  constructor(
    private svc: ParcellationVisibilityService
  ){

  }

  otherVersions: SapiParcellationModel[]

  ngOnChanges() {
    this.otherVersions = []
    if (!this.parcellation) {
      return
    }
    this.otherVersions = [ this.parcellation ]
    if (!this.parcellations || this.parcellations.length === 0) {
      return 
    }
    if (!this.parcellation.version) {
      return 
    }

    this.otherVersions = []

    const {
      findNewest,
      findOlder
    } = getTraverseFunctions(this.parcellations)

    let cursor: SapiParcellationModel = findNewest()
    while (cursor) {
      this.otherVersions.push(cursor)
      cursor = findOlder(cursor)
    }
  }

  parcellationVisibility$: Observable<boolean> = this.svc.visibility$

  toggleParcellationVisibility(){
    this.svc.toggleVisibility()
  }

  dismiss(){
    this.onDismiss.emit(this.parcellation)
  }

  selectParcellation(parc: SapiParcellationModel){
    if (parc === this.parcellation) return
    this.onSelectParcellation.emit(parc)
  }
}
