import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Observable } from "rxjs";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";
import { ParcellationVisibilityService } from "../parcellationVis.service";

@Component({
  selector: `sxplr-sapiviews-core-parcellation-smartchip`,
  templateUrl: `./parcellation.smartChip.template.html`,
  styleUrls: [
    `./parcellation.smartChip.style.css`
  ]
})

export class SapiViewsCoreParcellationParcellationSmartChip implements OnChanges{

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
    const getTraverse = (key: 'prev' | 'next') => (parc: SapiParcellationModel) => {
      if (!parc.version) {
        throw new Error(`parcellation ${parc.name} does not have version defined!`)
      }
      if (!parc.version[key]) {
        return null
      }
      const found = this.parcellations.find(p => p["@id"] === parc.version[key]["@id"])
      if (!found) {
        throw new Error(`parcellation ${parc.name} references ${parc.version[key]['@id']} as ${key} version, but it cannot be found.`)
      }
      return found
    }

    const findNewer = getTraverse('next')
    const findOlder = getTraverse('prev')

    const newest = (() => {
      let cursor = this.parcellation
      let newest: SapiParcellationModel
      while (cursor) {
        newest = cursor
        cursor = findNewer(cursor)
      }
      return newest
    })()

    let cursor: SapiParcellationModel = newest
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

    console.log('select parcellation', parc)
  }
}
