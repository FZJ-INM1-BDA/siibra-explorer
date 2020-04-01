import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"; import {
  SingleDatasetBase,
  DatabrowserService,
  KgSingleDatasetService,
} from "../singleDataset.base";
import { SingleDatasetView } from "../detailedView/singleDataset.component";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'single-dataset-list-view',
  templateUrl: './singleDatasetListView.template.html',
  styleUrls: [
    './singleDatasetListView.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SingleDatasetListView extends SingleDatasetBase {

  constructor(
    _dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    snackBar: MatSnackBar,
  ) {
    super(_dbService, singleDatasetService, cdr, snackBar)
  }

  public showDetailInfo() {
    this.dialog.open(SingleDatasetView, {
      autoFocus: false,
      data: {
        fullId: this.fullId
      },
    })
  }
}
