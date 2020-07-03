import { ChangeDetectorRef, Component, Inject, Optional} from "@angular/core";
import {
  DatabrowserService,
  KgSingleDatasetService,
  SingleDatasetBase,
} from "../singleDataset.base";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: 'single-dataset-view',
  templateUrl: './singleDataset.template.html',
  styleUrls: [
    `./singleDataset.style.css`,
  ]
})

export class SingleDatasetView extends SingleDatasetBase {

  constructor(
    dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    snackbar: MatSnackBar,
    @Optional() @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    super(dbService, singleDatasetService, cdr,snackbar, data)
  }

}
