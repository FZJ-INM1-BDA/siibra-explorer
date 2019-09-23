import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Optional, Inject} from "@angular/core";
import { 
  SingleDatasetBase,
  DatabrowserService,
  KgSingleDatasetService,
  AtlasViewerConstantsServices
} from "../singleDataset.base";
import { MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: 'single-dataset-view',
  templateUrl: './singleDataset.template.html',
  styleUrls: [
    `./singleDataset.style.css`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SingleDatasetView extends SingleDatasetBase{

  constructor(
    dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    constantService: AtlasViewerConstantsServices,

    @Optional() @Inject(MAT_DIALOG_DATA) data: any
  ){
    super(dbService, singleDatasetService, cdr, constantService, data)
  }
}
