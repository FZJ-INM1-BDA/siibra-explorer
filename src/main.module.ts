import { NgModule } from "@angular/core";
import { ComponentsModule } from "./components/components.module";
import { DragDropModule } from '@angular/cdk/drag-drop'
import { UIModule } from "./ui/ui.module";
import { LayoutModule } from "./layouts/layout.module";
import { AtlasViewer } from "./atlasViewer/atlasViewer.component";
import { StoreModule } from "@ngrx/store";
import { viewerState, dataStore, uiState, ngViewerState, pluginState, viewerConfigState, userConfigState, UserConfigStateUseEffect } from "./services/stateStore.service";
import { GetNamesPipe } from "./util/pipes/getNames.pipe";
import { CommonModule } from "@angular/common";
import { GetNamePipe } from "./util/pipes/getName.pipe";
import { FormsModule } from "@angular/forms";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'

import { AtlasViewerDataService } from "./atlasViewer/atlasViewer.dataService.service";
import { WidgetUnit } from "./atlasViewer/widgetUnit/widgetUnit.component";
import { WidgetServices } from './atlasViewer/widgetUnit/widgetService.service'
import { fasTooltipScreenshotDirective,fasTooltipInfoSignDirective,fasTooltipLogInDirective,fasTooltipNewWindowDirective,fasTooltipQuestionSignDirective,fasTooltipRemoveDirective,fasTooltipRemoveSignDirective } from "./util/directives/glyphiconTooltip.directive";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { TabsModule } from 'ngx-bootstrap/tabs'
import { ModalUnit } from "./atlasViewer/modalUnit/modalUnit.component";
import { AtlasViewerURLService } from "./atlasViewer/atlasViewer.urlService.service";
import { ToastComponent } from "./components/toast/toast.component";
import { AtlasViewerAPIServices } from "./atlasViewer/atlasViewer.apiService.service";
import { PluginUnit } from "./atlasViewer/pluginUnit/pluginUnit.component";
import { NewViewerDisctinctViewToLayer } from "./util/pipes/newViewerDistinctViewToLayer.pipe";
import { AtlasWorkerService } from "./atlasViewer/atlasViewer.workerService.service";
import { DockedContainerDirective } from "./util/directives/dockedContainer.directive";
import { FloatingContainerDirective } from "./util/directives/floatingContainer.directive";
import { PluginFactoryDirective } from "./util/directives/pluginFactory.directive";
import { FloatingMouseContextualContainerDirective } from "./util/directives/floatingMouseContextualContainer.directive";
import { AuthService } from "./services/auth.service";
import { DatabrowserService } from "./ui/databrowserModule/databrowser.service";
import { TransformOnhoverSegmentPipe } from "./atlasViewer/onhoverSegment.pipe";
import {HttpClientModule} from "@angular/common/http";
import { EffectsModule } from "@ngrx/effects";
import { UseEffects } from "./services/effect/effect";
import { DragDropDirective } from "./util/directives/dragDrop.directive";
import { LocalFileService } from "./services/localFile.service";
import { DataBrowserUseEffect } from "./ui/databrowserModule/databrowser.useEffect";
import { DialogService } from "./services/dialogService.service";
import { DialogComponent } from "./components/dialog/dialog.component";
import { ViewerStateControllerUseEffect } from "./ui/viewerStateController/viewerState.useEffect";
import { ConfirmDialogComponent } from "./components/confirmDialog/confirmDialog.component";
import { ViewerStateUseEffect } from "./services/state/viewerState.store";
import { NgViewerUseEffect } from "./services/state/ngViewerState.store";
import { DatabrowserModule } from "./ui/databrowserModule/databrowser.module";
import { UIService } from "./services/uiService.service";
import { UtilModule } from "./util/util.module";

import 'hammerjs'

import 'src/res/css/version.css'
import 'src/theme.scss'
import 'src/res/css/extra_styles.css'
import {CaptureClickListenerDirective} from "src/util/directives/captureClickListener.directive";

@NgModule({
  imports : [
    FormsModule,
    CommonModule,
    LayoutModule,
    ComponentsModule,
    DragDropModule,
    UIModule,
    DatabrowserModule,
    AngularMaterialModule,
    UtilModule,
    
    TooltipModule.forRoot(),
    TabsModule.forRoot(),
    EffectsModule.forRoot([
      DataBrowserUseEffect,
      UseEffects,
      UserConfigStateUseEffect,
      ViewerStateControllerUseEffect,
      ViewerStateUseEffect,
      NgViewerUseEffect
    ]),
    StoreModule.forRoot({
      pluginState,
      viewerConfigState,
      ngViewerState,
      viewerState,
      dataStore,
      uiState,
      userConfigState
    }),
    HttpClientModule
  ],
  declarations : [
    AtlasViewer,
    WidgetUnit,
    ModalUnit,
    PluginUnit,

    /* directives */
    fasTooltipScreenshotDirective,
    fasTooltipInfoSignDirective,
    fasTooltipLogInDirective,
    fasTooltipNewWindowDirective,
    fasTooltipQuestionSignDirective,
    fasTooltipRemoveDirective,
    fasTooltipRemoveSignDirective,
    DockedContainerDirective,
    FloatingContainerDirective,
    PluginFactoryDirective,
    FloatingMouseContextualContainerDirective,
    DragDropDirective,
    CaptureClickListenerDirective,

    /* pipes */
    GetNamesPipe,
    GetNamePipe,
    TransformOnhoverSegmentPipe,
    NewViewerDisctinctViewToLayer
  ],
  entryComponents : [
    WidgetUnit,
    ModalUnit,
    ToastComponent,
    PluginUnit,
    DialogComponent,
    ConfirmDialogComponent,
  ],
  providers : [
    AtlasViewerDataService,
    WidgetServices,
    AtlasViewerURLService,
    AtlasViewerAPIServices,
    AtlasWorkerService,
    AuthService,
    LocalFileService,
    DialogService,
    UIService,
    
    /**
     * TODO
     * once nehubacontainer is separated into viewer + overlay, migrate to nehubaContainer module
     */
    DatabrowserService
  ],
  bootstrap : [
    AtlasViewer
  ]
})

export class MainModule{
  
  constructor(
    authServce: AuthService,

    /**
     * instantiate singleton
     * allow for pre fetching of dataentry
     * TODO only fetch when traffic is idle
     */
    dbSerivce: DatabrowserService
  ){
    authServce.authReloadState()
  }
}
