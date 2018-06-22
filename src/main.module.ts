import { NgModule } from "@angular/core";
import { ComponentsModule } from "./components/components.module";
import { UIModule } from "./ui/ui.module";
import { LayoutModule } from "./layouts/layout.module";
import { AtlasViewer } from "./atlasViewer/atlasViewer.component";
import { StoreModule } from "@ngrx/store";
import { viewerState, dataStore,spatialSearchState,uiState } from "./services/stateStore.service";
import { AtlasBanner } from "./ui/banner/banner.component";
import { GetNamesPipe } from "./util/pipes/getNames.pipe";
import { CommonModule } from "@angular/common";
import { GetNamePipe } from "./util/pipes/getName.pipe";
import { FormsModule } from "@angular/forms";

import { PopoverModule } from 'ngx-bootstrap/popover'
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

@NgModule({
  imports : [
    FormsModule,
    CommonModule,
    LayoutModule,
    ComponentsModule,
    UIModule,
    
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
    PopoverModule.forRoot(),
    StoreModule.forRoot({
      viewerState ,
      dataStore ,
      spatialSearchState,
      uiState
    })
  ],
  declarations : [
    AtlasViewer,
    AtlasBanner,
    WidgetUnit,
    ModalUnit,

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
    FilterNameBySearch
  ],
  entryComponents : [
    WidgetUnit,
    ModalUnit,
    ToastComponent,
  ],
  providers : [
    AtlasViewerDataService,
    AtlasViewerDataService,
    WidgetServices,
    AtlasViewerURLService
  ],
  bootstrap : [
    AtlasViewer
  ]
})

export class MainModule{

}