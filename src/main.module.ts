import { DragDropModule } from '@angular/cdk/drag-drop'
import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { StoreModule } from "@ngrx/store";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { AtlasViewer } from "./atlasViewer/atlasViewer.component";
import { ComponentsModule } from "./components/components.module";
import { LayoutModule } from "./layouts/layout.module";
import { dataStore, ngViewerState, pluginState, uiState, userConfigState, UserConfigStateUseEffect, viewerConfigState, viewerState } from "./services/stateStore.service";
import { UIModule } from "./ui/ui.module";
import { GetNamePipe } from "./util/pipes/getName.pipe";
import { GetNamesPipe } from "./util/pipes/getNames.pipe";

import {HttpClientModule} from "@angular/common/http";
import { EffectsModule } from "@ngrx/effects";
import { TabsModule } from 'ngx-bootstrap/tabs'
import { TooltipModule } from "ngx-bootstrap/tooltip";
import {CaptureClickListenerDirective} from "src/util/directives/captureClickListener.directive";
import { AtlasViewerAPIServices } from "./atlasViewer/atlasViewer.apiService.service";
import { AtlasWorkerService } from "./atlasViewer/atlasViewer.workerService.service";
import { ModalUnit } from "./atlasViewer/modalUnit/modalUnit.component";
import { TransformOnhoverSegmentPipe } from "./atlasViewer/onhoverSegment.pipe";
import { PluginUnit } from "./atlasViewer/pluginUnit/pluginUnit.component";
import { WidgetServices } from './atlasViewer/widgetUnit/widgetService.service'
import { WidgetUnit } from "./atlasViewer/widgetUnit/widgetUnit.component";
import { ConfirmDialogComponent } from "./components/confirmDialog/confirmDialog.component";
import { DialogComponent } from "./components/dialog/dialog.component";
import { AuthService } from "./services/auth.service";
import { DialogService } from "./services/dialogService.service";
import { UseEffects } from "./services/effect/effect";
import { LocalFileService } from "./services/localFile.service";
import { NgViewerUseEffect } from "./services/state/ngViewerState.store";
import { ViewerStateUseEffect } from "./services/state/viewerState.store";
import { UIService } from "./services/uiService.service";
import { DatabrowserModule } from "./ui/databrowserModule/databrowser.module";
import { DatabrowserService } from "./ui/databrowserModule/databrowser.service";
import { DataBrowserUseEffect } from "./ui/databrowserModule/databrowser.useEffect";
import { ViewerStateControllerUseEffect } from "./ui/viewerStateController/viewerState.useEffect";
import { DockedContainerDirective } from "./util/directives/dockedContainer.directive";
import { DragDropDirective } from "./util/directives/dragDrop.directive";
import { FloatingContainerDirective } from "./util/directives/floatingContainer.directive";
import { FloatingMouseContextualContainerDirective } from "./util/directives/floatingMouseContextualContainer.directive";
import { PluginFactoryDirective } from "./util/directives/pluginFactory.directive";
import { NewViewerDisctinctViewToLayer } from "./util/pipes/newViewerDistinctViewToLayer.pipe";
import { UtilModule } from "./util/util.module";

import 'hammerjs'

import 'src/res/css/extra_styles.css'
import 'src/res/css/version.css'
import {UiStateUseEffect} from "src/services/state/uiState.store";
import 'src/theme.scss'
import { AtlasViewerHistoryUseEffect } from "./atlasViewer/atlasViewer.history.service";
import { PluginServiceUseEffect } from './services/effect/pluginUseEffect';
import { LoggingService } from "./services/logging.service";
import {TemplateCoordinatesTransformation} from "src/services/templateCoordinatesTransformation.service";

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
      NgViewerUseEffect,
      PluginServiceUseEffect,
      AtlasViewerHistoryUseEffect,
      UiStateUseEffect,
    ]),
    StoreModule.forRoot({
      pluginState,
      viewerConfigState,
      ngViewerState,
      viewerState,
      dataStore,
      uiState,
      userConfigState,
    }),
    HttpClientModule,
  ],
  declarations : [
    AtlasViewer,
    WidgetUnit,
    ModalUnit,
    PluginUnit,

    /* directives */
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
    NewViewerDisctinctViewToLayer,
  ],
  entryComponents : [
    WidgetUnit,
    ModalUnit,
    PluginUnit,
    DialogComponent,
    ConfirmDialogComponent,
  ],
  providers : [
    WidgetServices,
    AtlasViewerAPIServices,
    AtlasWorkerService,
    AuthService,
    LocalFileService,
    DialogService,
    UIService,
    LoggingService,
    TemplateCoordinatesTransformation,

    /**
     * TODO
     * once nehubacontainer is separated into viewer + overlay, migrate to nehubaContainer module
     */
    DatabrowserService,
  ],
  bootstrap : [
    AtlasViewer,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
})

export class MainModule {

  constructor(
    authServce: AuthService,
  ) {
    authServce.authReloadState()
  }
}
