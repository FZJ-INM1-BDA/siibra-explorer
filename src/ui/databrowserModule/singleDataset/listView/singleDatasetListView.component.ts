import { Component,ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";import { 
  SingleDatasetBase,
  DatabrowserService,
  KgSingleDatasetService,
  AtlasViewerConstantsServices
} from "../singleDataset.base";

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
    dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    constantService: AtlasViewerConstantsServices
  ){
    super(dbService, singleDatasetService, cdr, constantService)
  }
}