import { CommonModule } from "@angular/common";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components/components.module";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { DoiParserPipe } from "src/util/pipes/doiPipe.pipe";
import { UtilModule } from "src/util/util.module";
import { DataBrowser } from "./databrowser/databrowser.component";
import { KgSingleDatasetService } from "./kgSingleDatasetService.service"
import { ModalityPicker } from "./modalityPicker/modalityPicker.component";
import { SingleDatasetView } from './singleDataset/detailedView/singleDataset.component'
import { AggregateArrayIntoRootPipe } from "./util/aggregateArrayIntoRoot.pipe";
import { CopyPropertyPipe } from "./util/copyProperty.pipe";
import { DatasetIsFavedPipe } from "./util/datasetIsFaved.pipe";
import { FilterDataEntriesbyMethods } from "./util/filterDataEntriesByMethods.pipe";
import { FilterDataEntriesByRegion } from "./util/filterDataEntriesByRegion.pipe";
import { PathToNestedChildren } from "./util/pathToNestedChildren.pipe";
import { RegionBackgroundToRgbPipe } from "./util/regionBackgroundToRgb.pipe";

import { ScrollingModule } from "@angular/cdk/scrolling";
import { PreviewFileIconPipe } from "./preview/previewFileIcon.pipe";
import { PreviewFileTypePipe } from "./preview/previewFileType.pipe";
import { SingleDatasetListView } from "./singleDataset/listView/singleDatasetListView.component";
import { AppendFilerModalityPipe } from "./util/appendFilterModality.pipe";
import { GetKgSchemaIdFromFullIdPipe } from "./util/getKgSchemaIdFromFullId.pipe";
import { ResetCounterModalityPipe } from "./util/resetCounterModality.pipe";
import { PreviewFileVisibleInSelectedReferenceTemplatePipe } from "./util/previewFileDisabledByReferenceSpace.pipe";
import { DatasetPreviewList, UnavailableTooltip } from "./singleDataset/datasetPreviews/datasetPreviewsList/datasetPreviewList.component";
import { PreviewComponentWrapper } from "./preview/previewComponentWrapper/previewCW.component";
import { BulkDownloadBtn, TransformDatasetToIdPipe } from "./bulkDownload/bulkDownloadBtn.component";
import { ShowDatasetDialogDirective, IAV_DATASET_SHOW_DATASET_DIALOG_CMP } from "./showDatasetDialog.directive";
import { PreviewDatasetFile, IAV_DATASET_PREVIEW_DATASET_FN, IAV_DATASET_PREVIEW_ACTIVE } from "./singleDataset/datasetPreviews/previewDatasetFile.directive";
import { Store, select } from "@ngrx/store";
import { DATASETS_ACTIONS_TYPES } from "src/services/state/dataStore.store";
import { startWith, map, take, debounceTime } from "rxjs/operators";
import { Observable } from "rxjs";

const previewDisplayedFactory = (store: Store<any>) => {

  return (file, dataset) => store.pipe(
    select('dataStore'),
    select('datasetPreviews'),
    startWith([]),
    map(datasetPreviews => {
      const { fullId } = dataset || {}
      const { filename } = file
      return (datasetPreviews as any[]).findIndex(({ datasetId, filename: fName }) =>
        datasetId === fullId && fName === filename) >= 0
    })
  )
}

// TODO not too sure if this is the correct place for providing the callback token
const previewEmitFactory = (store: Store<any>, previewDisplayed: (file,dataset) => Observable<boolean>) => {

  return (file, dataset) => {
    previewDisplayed(file, dataset).pipe(
      debounceTime(10),
      take(1),
    ).subscribe(flag => 
      
      store.dispatch({
        type: flag
          ? DATASETS_ACTIONS_TYPES.CLEAR_PREVIEW_DATASET
          : DATASETS_ACTIONS_TYPES.PREVIEW_DATASET,
        payload: {
          file,
          dataset
        }
      })
    )
  }
}

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    ScrollingModule,
    FormsModule,
    UtilModule,
    AngularMaterialModule,
  ],
  declarations: [
    DataBrowser,
    ModalityPicker,
    SingleDatasetView,
    SingleDatasetListView,
    DatasetPreviewList,
    PreviewComponentWrapper,
    BulkDownloadBtn,

    /**
     * Directives
     */
    ShowDatasetDialogDirective,
    PreviewDatasetFile,

    /**
     * pipes
     */
    PathToNestedChildren,
    CopyPropertyPipe,
    FilterDataEntriesbyMethods,
    FilterDataEntriesByRegion,
    AggregateArrayIntoRootPipe,
    DoiParserPipe,
    DatasetIsFavedPipe,
    RegionBackgroundToRgbPipe,
    GetKgSchemaIdFromFullIdPipe,
    PreviewFileIconPipe,
    PreviewFileTypePipe,
    AppendFilerModalityPipe,
    ResetCounterModalityPipe,
    PreviewFileVisibleInSelectedReferenceTemplatePipe,
    UnavailableTooltip,
    TransformDatasetToIdPipe,
  ],
  exports: [
    DataBrowser,
    SingleDatasetView,
    SingleDatasetListView,
    ModalityPicker,
    FilterDataEntriesbyMethods,
    GetKgSchemaIdFromFullIdPipe,
    BulkDownloadBtn,
    TransformDatasetToIdPipe,
    ShowDatasetDialogDirective,
    PreviewDatasetFile,
  ],
  entryComponents: [
    DataBrowser,
    SingleDatasetView,
    PreviewComponentWrapper
  ],
  providers: [
    KgSingleDatasetService,
    {
      provide: IAV_DATASET_SHOW_DATASET_DIALOG_CMP,
      useValue: SingleDatasetView
    },{
      provide: IAV_DATASET_PREVIEW_DATASET_FN,
      useFactory: previewEmitFactory,
      deps: [ Store, IAV_DATASET_PREVIEW_ACTIVE ]
    },{
      provide: IAV_DATASET_PREVIEW_ACTIVE,
      useFactory: previewDisplayedFactory,
      deps: [ Store ]
    }
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
  /**
   * shouldn't need bootstrap, so no need for browser module
   */
})

export class DatabrowserModule {
}
