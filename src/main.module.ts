import { NgModule } from "@angular/core";
import { ComponentsModule } from "./components/components.module";
import { DragDropModule } from '@angular/cdk/drag-drop'
import { UIModule } from "./ui/ui.module";
import { LayoutModule } from "./layouts/layout.module";
import { AtlasViewer } from "./atlasViewer/atlasViewer.component";
import { StoreModule, Store, select } from "@ngrx/store";
import { viewerState, dataStore,spatialSearchState,uiState, ngViewerState, pluginState, viewerConfigState, userConfigState, UserConfigStateUseEffect } from "./services/stateStore.service";
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
import { ToastService } from "./services/toastService.service";
import { AtlasWorkerService } from "./atlasViewer/atlasViewer.workerService.service";
import { HelpDirective } from "./util/directives/help.directive";
import { ToastContainerDirective } from "./util/directives/toastContainer.directive";
import { DockedContainerDirective } from "./util/directives/dockedContainer.directive";
import { FloatingContainerDirective } from "./util/directives/floatingContainer.directive";
import { PluginFactoryDirective } from "./util/directives/pluginFactory.directive";
import { FloatingMouseContextualContainerDirective } from "./util/directives/floatingMouseContextualContainer.directive";
import { AuthService } from "./services/auth.service";
import { ViewerConfiguration, LOCAL_STORAGE_CONST } from "./services/state/viewerConfig.store";
import { FixedMouseContextualContainerDirective } from "./util/directives/FixedMouseContextualContainerDirective.directive";
import { DatabrowserService } from "./ui/databrowserModule/databrowser.service";
import { TransformOnhoverSegmentPipe } from "./atlasViewer/onhoverSegment.pipe";
import {HttpClientModule} from "@angular/common/http";
import { EffectsModule } from "@ngrx/effects";
import { UseEffects } from "./services/effect/effect";
import { DataBrowserUseEffect } from "./ui/databrowserModule/databrowser.useEffect";
import { DialogService } from "./services/dialogService.service";
import { DialogComponent } from "./components/dialog/dialog.component";
import { ViewerStateControllerUseEffect } from "./ui/viewerStateController/viewerState.useEffect";
import { ConfirmDialogComponent } from "./components/confirmDialog/confirmDialog.component";
import { ViewerStateUseEffect } from "./services/state/viewerState.store";

import 'hammerjs'

@NgModule({
  imports : [
    FormsModule,
    CommonModule,
    LayoutModule,
    ComponentsModule,
    DragDropModule,
    UIModule,
    AngularMaterialModule,
    
    TooltipModule.forRoot(),
    TabsModule.forRoot(),
    EffectsModule.forRoot([
      DataBrowserUseEffect,
      UseEffects,
      UserConfigStateUseEffect,
      ViewerStateControllerUseEffect,
      ViewerStateUseEffect,
    ]),
    StoreModule.forRoot({
      pluginState,
      viewerConfigState,
      ngViewerState,
      viewerState,
      dataStore,
      spatialSearchState,
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
    HelpDirective,
    ToastContainerDirective,
    DockedContainerDirective,
    FloatingContainerDirective,
    PluginFactoryDirective,
    FloatingMouseContextualContainerDirective,
    FixedMouseContextualContainerDirective,

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
    ToastService,
    AtlasWorkerService,
    AuthService,
    DialogService,
    
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
    store: Store<ViewerConfiguration>,

    /**
     * instantiate singleton
     * allow for pre fetching of dataentry
     * TODO only fetch when traffic is idle
     */
    dbSerivce: DatabrowserService
  ){
    authServce.authReloadState()
    store.pipe(
      select('viewerConfigState')
    ).subscribe(({ gpuLimit, animation }) => {
      if (gpuLimit) {
        window.localStorage.setItem(LOCAL_STORAGE_CONST.GPU_LIMIT, gpuLimit.toString())
      }
      if (typeof animation !== 'undefined' && animation !== null) {
        window.localStorage.setItem(LOCAL_STORAGE_CONST.ANIMATION, animation.toString())
      }
    })
  }
}