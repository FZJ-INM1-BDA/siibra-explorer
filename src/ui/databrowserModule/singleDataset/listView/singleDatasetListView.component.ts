import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"; import {
  SingleDatasetBase,
  DatabrowserService,
  KgSingleDatasetService,
} from "../singleDataset.base";
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
    snackBar: MatSnackBar,
  ) {
    super(_dbService, singleDatasetService, cdr, snackBar)
  }
}
