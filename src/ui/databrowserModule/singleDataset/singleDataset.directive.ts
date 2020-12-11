import { ChangeDetectorRef, Directive } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DatabrowserService, KgSingleDatasetService, SingleDatasetBase } from "./singleDataset.base";

@Directive({
  selector: '[single-dataset-directive]',
  exportAs: 'singleDatasetDirective'
})

export class SingleDatasetDirective extends SingleDatasetBase{
  constructor(
    dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    snackBar: MatSnackBar,
  ){
    super(
      dbService,
      singleDatasetService,
      cdr,
      snackBar,
    )
  }
}