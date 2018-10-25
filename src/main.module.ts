import { NgModule } from "@angular/core";
import { ComponentsModule } from "./components/components.module";
import { UIModule } from "./ui/ui.module";
import { LayoutModule } from "./layouts/layout.module";
import { AtlasViewer } from "./atlasViewer/atlasViewer.component";
import { StoreModule } from "@ngrx/store";
import { viewerState, dataStore,spatialSearchState,uiState, ngViewerState, pluginState } from "./services/stateStore.service";
import { GetNamesPipe } from "./util/pipes/getNames.pipe";
import { CommonModule } from "@angular/common";
import { GetNamePipe } from "./util/pipes/getName.pipe";
import { FormsModule } from "@angular/forms";

import { AtlasViewerDataService } from "./atlasViewer/atlasViewer.dataService.service";
import { WidgetUnit } from "./atlasViewer/widgetUnit/widgetUnit.component";
import { WidgetServices } from './atlasViewer/widgetUnit/widgetService.service'
import { GlyphiconTooltipScreenshotDirective,GlyphiconTooltipInfoSignDirective,GlyphiconTooltipLogInDirective,GlyphiconTooltipNewWindowDirective,GlyphiconTooltipQuestionSignDirective,GlyphiconTooltipRemoveDirective,GlyphiconTooltipRemoveSignDirective } from "./util/directives/glyphiconTooltip.directive";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { ModalModule } from 'ngx-bootstrap/modal'
import { ModalUnit } from "./atlasViewer/modalUnit/modalUnit.component";
import { AtlasViewerURLService } from "./atlasViewer/atlasViewer.urlService.service";
import { ToastComponent } from "./components/toast/toast.component";
import { GetFilenameFromPathnamePipe } from "./util/pipes/getFileNameFromPathName.pipe";
import { FilterNameBySearch } from "./util/pipes/filterNameBySearch.pipe";
import { AtlasViewerAPIServices } from "./atlasViewer/atlasViewer.apiService.service";
import { PluginUnit } from "./atlasViewer/pluginUnit/pluginUnit.component";
import { NewViewerDisctinctViewToLayer } from "./util/pipes/newViewerDistinctViewToLayer.pipe";
import { ToastService } from "./services/toastService.service";
import { AtlasWorkerService } from "./atlasViewer/atlasViewer.workerService.service";

@NgModule({
  imports : [
    FormsModule,
    CommonModule,
    LayoutModule,
    ComponentsModule,
    UIModule,
    
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
    StoreModule.forRoot({
      viewerState ,
      dataStore ,
      spatialSearchState,
      uiState,
      ngViewerState,
      pluginState
    })
  ],
  declarations : [
    AtlasViewer,
    WidgetUnit,
    ModalUnit,
    PluginUnit,

    /* directives */
    GlyphiconTooltipScreenshotDirective,
    GlyphiconTooltipInfoSignDirective,
    GlyphiconTooltipLogInDirective,
    GlyphiconTooltipNewWindowDirective,
    GlyphiconTooltipQuestionSignDirective,
    GlyphiconTooltipRemoveDirective,
    GlyphiconTooltipRemoveSignDirective,

    /* pipes */
    GetNamesPipe,
    GetNamePipe,
    GetFilenameFromPathnamePipe,
    FilterNameBySearch,
    NewViewerDisctinctViewToLayer
  ],
  entryComponents : [
    WidgetUnit,
    ModalUnit,
    ToastComponent,
    PluginUnit,
  ],
  providers : [
    AtlasViewerDataService,
    WidgetServices,
    AtlasViewerURLService,
    AtlasViewerAPIServices,
    ToastService,
    AtlasWorkerService,
  ],
  bootstrap : [
    AtlasViewer
  ]
})

export class MainModule{

}