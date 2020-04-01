import { CommonModule } from "@angular/common";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
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
  ],
  entryComponents: [
    DataBrowser,
    SingleDatasetView,
    PreviewComponentWrapper
  ],
  providers: [
    KgSingleDatasetService,
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
