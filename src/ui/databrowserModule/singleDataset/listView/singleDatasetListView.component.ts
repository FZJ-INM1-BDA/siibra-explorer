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
    private _dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    super(_dbService, singleDatasetService, cdr)
  }

  public showDetailInfo() {
    this.dialog.open(SingleDatasetView, {
      data: this.dataset,
    })
  }

  public undoableRemoveFav() {
    this.snackBar.open(`Unpinned dataset: ${this.dataset.name}`, 'Undo', {
      duration: 5000,
    })
      .afterDismissed()
      .subscribe(({ dismissedByAction }) => {
        if (dismissedByAction) {
          this._dbService.saveToFav(this.dataset)
        }
      })
    this._dbService.removeFromFav(this.dataset)
  }

  public undoableAddFav() {
    this.snackBar.open(`Pin dataset: ${this.dataset.name}`, 'Undo', {
      duration: 5000,
    })
      .afterDismissed()
      .subscribe(({ dismissedByAction }) => {
        if (dismissedByAction) {
          this._dbService.removeFromFav(this.dataset)
        }
      })
    this._dbService.saveToFav(this.dataset)
  }
}
