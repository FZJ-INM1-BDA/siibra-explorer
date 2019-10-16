import { Component,ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";import { 
  SingleDatasetBase,
  DatabrowserService,
  KgSingleDatasetService,
  AtlasViewerConstantsServices
} from "../singleDataset.base";
import { MatDialog, MatSnackBar } from "@angular/material";
import { SingleDatasetView } from "../detailedView/singleDataset.component";

@Component({
  selector: 'single-dataset-list-view',
  templateUrl: './singleDatasetListView.template.html',
  styleUrls: [
    './singleDatasetListView.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SingleDatasetListView extends SingleDatasetBase {

  constructor(
    private _dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    constantService: AtlasViewerConstantsServices,
    private dialog:MatDialog,
    private snackBar: MatSnackBar
  ){
    super(_dbService, singleDatasetService, cdr, constantService)
  }

  showDetailInfo(){
    this.dialog.open(SingleDatasetView, {
      data: this.dataset
    })
  }

  undoableRemoveFav(){
    this.snackBar.open(`Unpinned dataset: ${this.dataset.name}`, 'Undo', {
      duration: 5000
    })
      .afterDismissed()
      .subscribe(({ dismissedByAction }) => {
        if (dismissedByAction) {
          this._dbService.saveToFav(this.dataset)
        }
      })
    this._dbService.removeFromFav(this.dataset)
  }

  undoableAddFav(){
    this.snackBar.open(`Pin dataset: ${this.dataset.name}`, 'Undo', {
      duration: 5000
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