import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Optional} from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material";
import {
  AtlasViewerConstantsServices,
  DatabrowserService,
  KgSingleDatasetService,
  SingleDatasetBase,
} from "../singleDataset.base";

@Component({
  selector: 'single-dataset-view',
  templateUrl: './singleDataset.template.html',
  styleUrls: [
    `./singleDataset.style.css`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SingleDatasetView extends SingleDatasetBase {

  constructor(
    dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    constantService: AtlasViewerConstantsServices,

    @Optional() @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    super(dbService, singleDatasetService, cdr, constantService, data)
  }
}
