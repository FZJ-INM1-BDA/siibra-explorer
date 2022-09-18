import {Component, EventEmitter, Inject, Input, OnChanges, Output, SimpleChanges} from "@angular/core";
import { BehaviorSubject, concat, Observable, of, timer } from "rxjs";
import {SapiParcellationModel, SapiSpaceModel} from "src/atlasComponents/sapi/type";
import { ParcellationVisibilityService } from "../parcellationVis.service";
import { ARIA_LABELS } from "common/constants"
import { getTraverseFunctions } from "../parcellationVersion.pipe";
import {filter, mapTo, shareReplay, switchMap, take} from "rxjs/operators";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: `sxplr-sapiviews-core-parcellation-smartchip`,
  templateUrl: `./parcellation.smartChip.template.html`,
  styleUrls: [
    `./parcellation.smartChip.style.css`
  ]
})

export class SapiViewsCoreParcellationParcellationSmartChip implements OnChanges{

  public ARIA_LABELS = ARIA_LABELS

  @Input('sxplr-sapiviews-core-parcellation-smartchip-selected-space')
  selectedSpace: SapiSpaceModel

  @Input('sxplr-sapiviews-core-parcellation-smartchip-selected-all-spaces')
  allAvailableSpaces: SapiSpaceModel[]

  @Input('sxplr-sapiviews-core-parcellation-smartchip-parcellation')
  parcellation: SapiParcellationModel

  @Input('sxplr-sapiviews-core-parcellation-smartchip-all-parcellations')
  parcellations: SapiParcellationModel[]

  @Input('sxplr-sapiviews-core-parcellation-smartchip-custom-color')
  customColor: string

  @Output('sxplr-sapiviews-core-parcellation-smartchip-dismiss-nonbase-layer')
  onDismiss = new EventEmitter<SapiParcellationModel>()

  @Output('sxplr-sapiviews-core-parcellation-smartchip-select-parcellation')
  onSelectParcellation = new EventEmitter<SapiParcellationModel>()

  @Output('sxplr-sapiviews-core-parcellation-smartchip-select-space-parcellation')
  onSelectSpaceParcellation = new EventEmitter<{space: SapiSpaceModel, parcellation: SapiParcellationModel}>()

  constructor(
    private svc: ParcellationVisibilityService,
    public dialog: MatDialog
  ){

  }

  private templateNotAvailableDialog: MatDialogRef<TemplateNotAvailableDialog>

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

  selectSpaceAndParcellation(space, parcellation) {
    if (this.trackByFn(parcellation) === this.trackByFn(this.parcellation)
        && space['@id'] === this.selectedSpace['@id']) return

    this.onSelectSpaceParcellation.emit({space, parcellation})
  }

  openChangeTemplateModal(supportedSpaces, parc) {
    const spaces = this.allAvailableSpaces.filter(s => supportedSpaces.includes(s['@id']))
    this.templateNotAvailableDialog = this.dialog.open(TemplateNotAvailableDialog, {
      data: spaces
    })

    this.templateNotAvailableDialog.afterClosed().pipe(
      take(1),
      filter(r => !!r)
    ).subscribe(res => {
      this.selectSpaceAndParcellation(res, parc)
    })
  }

  onDismissClicked$ = new BehaviorSubject<boolean>(false)
}


@Component({
  selector: 'template-not-available-dialog',
  template: `
      <div class="d-flex align-items-start">

          <div class="flex-grow-1">
              <p>Parcellation is not available for the current template space. Please select template space to explore
                  the parcellation:</p>
              <div class="d-flex align-items-center">
                  <button mat-button *ngFor="let space of availableSpaces"
                  (click)="selectTemplate(space)">{{space.fullName}}</button>
              </div>
          </div>
          <button class="flex-grow-0" mat-icon-button (click)="dialogRef.close()"><i class="fas fa-times"></i></button>
      </div>
  `,
})
export class TemplateNotAvailableDialog {
  constructor(
    public dialogRef: MatDialogRef<TemplateNotAvailableDialog>,
    @Inject(MAT_DIALOG_DATA) public availableSpaces: SapiSpaceModel[],
  ) {}

  selectTemplate(space) {
    this.dialogRef.close(space)
  }
}