import { Component, EventEmitter, Input, OnChanges, Output, SimpleChange, SimpleChanges } from "@angular/core";
import { BehaviorSubject, concat, Observable, of, timer } from "rxjs";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";
import { ParcellationVisibilityService } from "../parcellationVis.service";
import { ARIA_LABELS } from "common/constants"
import { getTraverseFunctions } from "../parcellationVersion.pipe";
import { mapTo, shareReplay, switchMap } from "rxjs/operators";

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

  ngOnChanges(changes: SimpleChanges) {
    const { parcellation } = changes
    if (parcellation) {
      this.onDismissClicked$.next(false)
    }
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

  loadingParc$: Observable<SapiParcellationModel> = this.onSelectParcellation.pipe(
    switchMap(parc => concat(
      of(parc),
      timer(5000).pipe(
        mapTo(null)
      ),
    )),
    shareReplay(1),
  )

  parcellationVisibility$: Observable<boolean> = this.svc.visibility$

  toggleParcellationVisibility(){
    this.svc.toggleVisibility()
  }

  dismiss(){
    if (this.onDismissClicked$.value) return
    this.onDismissClicked$.next(true)
    this.onDismiss.emit(this.parcellation)
  }

  selectParcellation(parc: SapiParcellationModel){
    if (this.trackByFn(parc) === this.trackByFn(this.parcellation)) return
    this.onSelectParcellation.emit(parc)
  }

  trackByFn(parc: SapiParcellationModel){
    return parc["@id"]
  }

  onDismissClicked$ = new BehaviorSubject<boolean>(false)
}
