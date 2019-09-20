import { Component, ChangeDetectionStrategy, ChangeDetectorRef} from "@angular/core";
import { 
  SingleDatasetBase,
  DatabrowserService,
  KgSingleDatasetService,
  AtlasViewerConstantsServices
} from "../singleDataset.base";

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
    constantService: AtlasViewerConstantsServices
  ){
    super(dbService, singleDatasetService, cdr, constantService)
  }
}
