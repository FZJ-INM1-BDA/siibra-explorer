import { Component,ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";import { 
  SingleDatasetBase,
  DatabrowserService,
  KgSingleDatasetService,
  AtlasViewerConstantsServices
} from "../singleDataset.base";
import { MatDialog } from "@angular/material";
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
    dbService: DatabrowserService,
    singleDatasetService: KgSingleDatasetService,
    cdr: ChangeDetectorRef,
    constantService: AtlasViewerConstantsServices,
    private dialog:MatDialog
  ){
    super(dbService, singleDatasetService, cdr, constantService)
  }

  showDetailInfo(){
    this.dialog.open(SingleDatasetView, {
      data: this.dataset
    })
  }
}