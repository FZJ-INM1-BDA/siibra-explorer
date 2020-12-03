import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnChanges, OnDestroy, Optional, Output, EventEmitter } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Observable } from "rxjs";
import { REGION_OF_INTEREST, TRegionOfInterest } from "src/util/interfaces";
import { DatabrowserService } from "../../databrowser.service";
import { KgSingleDatasetService } from "../../kgSingleDatasetService.service";
import { SingleDatasetBase } from "../singleDataset.base";
import { CONST } from 'common/constants'

@Component({
  selector: 'single-dataset-sidenav-view',
  templateUrl: './sDsSideNavView.template.html',
  styleUrls: [
    './sDsSideNavView.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SingleDatasetSideNavView extends SingleDatasetBase implements OnChanges, OnDestroy{

  @Output()
  clear: EventEmitter<null> = new EventEmitter()

  public GDPR_TEXT = CONST.GDPR_TEXT

  constructor(
    dbService: DatabrowserService,
    sDsService: KgSingleDatasetService,
    private _cdr: ChangeDetectorRef,
    snackBar: MatSnackBar,
    @Optional() @Inject(REGION_OF_INTEREST) public region$: Observable<TRegionOfInterest>
  ){
    super(
      dbService,
      sDsService,
      _cdr,
      snackBar,
    )
  }
  ngOnDestroy(){
    super.ngOnDestroy()
  }
  ngOnChanges(){
    super.ngOnChanges()
  }
  
  detectChange(){
    this._cdr.detectChanges()
  }
}
