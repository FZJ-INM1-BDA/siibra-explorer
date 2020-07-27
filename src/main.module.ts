import { DragDropModule } from '@angular/cdk/drag-drop'
import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { StoreModule, Store, ActionReducer } from "@ngrx/store";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { AtlasViewer, NEHUBA_CLICK_OVERRIDE } from "./atlasViewer/atlasViewer.component";
import { ComponentsModule } from "./components/components.module";
import { LayoutModule } from "./layouts/layout.module";
import { ngViewerState, pluginState, uiState, userConfigState, UserConfigStateUseEffect, viewerConfigState, viewerState } from "./services/stateStore.service";
import { UIModule } from "./ui/ui.module";
import { GetNamePipe } from "./util/pipes/getName.pipe";
import { GetNamesPipe } from "./util/pipes/getNames.pipe";

import { HttpClientModule } from "@angular/common/http";
import { EffectsModule } from "@ngrx/effects";
import { AtlasViewerAPIServices, overrideNehubaClickFactory, CANCELLABLE_DIALOG, GET_TOAST_HANDLER_TOKEN } from "./atlasViewer/atlasViewer.apiService.service";
import { AtlasWorkerService } from "./atlasViewer/atlasViewer.workerService.service";
import { ModalUnit } from "./atlasViewer/modalUnit/modalUnit.component";
import { TransformOnhoverSegmentPipe } from "./atlasViewer/onhoverSegment.pipe";
import { ConfirmDialogComponent } from "./components/confirmDialog/confirmDialog.component";
import { DialogComponent } from "./components/dialog/dialog.component";
import { DialogService } from "./services/dialogService.service";
import { UseEffects } from "./services/effect/effect";
import { LocalFileService } from "./services/localFile.service";
import { NgViewerUseEffect } from "./services/state/ngViewerState.store";
import { ViewerStateUseEffect } from "./services/state/viewerState.store";
import { UIService } from "./services/uiService.service";
import { DatabrowserModule, OVERRIDE_IAV_DATASET_PREVIEW_DATASET_FN, DataBrowserFeatureStore, GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME } from "src/ui/databrowserModule";
import { DatabrowserService } from "./ui/databrowserModule/databrowser.service";
import { ViewerStateControllerUseEffect } from "./ui/viewerStateController/viewerState.useEffect";
import { DockedContainerDirective } from "./util/directives/dockedContainer.directive";
import { DragDropDirective } from "./util/directives/dragDrop.directive";
import { FloatingContainerDirective } from "./util/directives/floatingContainer.directive";
import { FloatingMouseContextualContainerDirective } from "./util/directives/floatingMouseContextualContainer.directive";
import { NewViewerDisctinctViewToLayer } from "./util/pipes/newViewerDistinctViewToLayer.pipe";
import { UtilModule } from "src/util";
import { SpotLightModule } from 'src/spotlight/spot-light.module'
import { TryMeComponent } from "./ui/tryme/tryme.component";
import { MouseHoverDirective, MouseOverIconPipe, MouseOverTextPipe } from "./atlasViewer/mouseOver.directive";
import { UiStateUseEffect, getMouseoverSegmentsFactory, GET_MOUSEOVER_SEGMENTS_TOKEN } from "src/services/state/uiState.store";
import { AtlasViewerHistoryUseEffect } from "./atlasViewer/atlasViewer.history.service";
import { PluginServiceUseEffect } from './services/effect/pluginUseEffect';
import { TemplateCoordinatesTransformation } from "src/services/templateCoordinatesTransformation.service";
import { NewTemplateUseEffect } from './services/effect/newTemplate.effect';
import { WidgetModule } from 'src/widget';
import { PluginModule } from './atlasViewer/pluginUnit/plugin.module';
import { LoggingModule } from './logging/logging.module';
import { ShareModule } from './share';
import { AuthService } from './auth'
import { IAV_DATASET_PREVIEW_ACTIVE } from 'src/ui/databrowserModule'

import 'hammerjs'
import 'src/res/css/extra_styles.css'
import 'src/res/css/version.css'
import 'src/theme.scss'
import { DatasetPreviewGlue, datasetPreviewMetaReducer, IDatasetPreviewGlue, GlueEffects } from './glue';
import { viewerStateHelperReducer, viewerStateFleshOutDetail, viewerStateMetaReducers, ViewerStateHelperEffect } from './services/state/viewerState.store.helper';

export function debug(reducer: ActionReducer<any>): ActionReducer<any> {
  return function(state, action) {
    console.log('state', state);
    console.log('action', action);
 
    return reducer(state, action);
  };
}
 

@NgModule({
  imports : [
    FormsModule,
    CommonModule,
    LayoutModule,
    ComponentsModule,
    DragDropModule,
    UIModule,
    DatabrowserModule,
    DataBrowserFeatureStore,
    AngularMaterialModule,
    UtilModule,
    WidgetModule,
    PluginModule,
    LoggingModule,
    ShareModule,

    SpotLightModule,
    
    EffectsModule.forRoot([
      UseEffects,
      UserConfigStateUseEffect,
      ViewerStateControllerUseEffect,
      ViewerStateUseEffect,
      NgViewerUseEffect,
      PluginServiceUseEffect,
      AtlasViewerHistoryUseEffect,
      UiStateUseEffect,
      NewTemplateUseEffect,
      ViewerStateHelperEffect,
      GlueEffects
    ]),
    StoreModule.forRoot({
      pluginState,
      viewerConfigState,
      ngViewerState,
      viewerState,
      viewerStateHelper: viewerStateHelperReducer,
      uiState,
      userConfigState,
    },{
      metaReducers: [ 
        // debug,
        ...viewerStateMetaReducers,
        datasetPreviewMetaReducer,
        viewerStateFleshOutDetail
      ]
    }),
    HttpClientModule,
  ],
  declarations : [
    AtlasViewer,
    ModalUnit,
    TryMeComponent,

    /* directives */
    DockedContainerDirective,
    FloatingContainerDirective,
    FloatingMouseContextualContainerDirective,
    DragDropDirective,
    MouseHoverDirective, 

    /* pipes */
    GetNamesPipe,
    GetNamePipe,
    TransformOnhoverSegmentPipe,
    NewViewerDisctinctViewToLayer,
    MouseOverTextPipe,
    MouseOverIconPipe,
  ],
  entryComponents : [
    ModalUnit,
    DialogComponent,
    ConfirmDialogComponent,
  ],
  providers : [
    AtlasViewerAPIServices,
    AtlasWorkerService,
    AuthService,
    LocalFileService,
    DialogService,
    UIService,
    TemplateCoordinatesTransformation,
    {
      provide: NEHUBA_CLICK_OVERRIDE,
      useFactory: overrideNehubaClickFactory,
      deps: [
        AtlasViewerAPIServices,
        GET_MOUSEOVER_SEGMENTS_TOKEN
      ]
    },
    {
      provide: GET_MOUSEOVER_SEGMENTS_TOKEN,
      useFactory: getMouseoverSegmentsFactory,
      deps: [ Store ]
    },
    {
      provide: GET_TOAST_HANDLER_TOKEN,
      useFactory: (uiService: UIService) => {
        return () => uiService.getToastHandler()
      },
      deps: [ UIService ]
    },
    {
      provide: OVERRIDE_IAV_DATASET_PREVIEW_DATASET_FN,
      useFactory: (glue: IDatasetPreviewGlue) => glue.displayDatasetPreview.bind(glue),
      deps: [ DatasetPreviewGlue ]
    },
    {
      provide: CANCELLABLE_DIALOG,
      useFactory: (uiService: UIService) => {
        return (message, option) => {
          const actionBtn = {
            type: 'mat-stroked-button',
            color: 'default',
            dismiss: true,
            text: 'Cancel',
            ariaLabel: 'Cancel'
          }
          const data = {
            content: message,
            config: {
              sameLine: true
            },
            actions: [ actionBtn ]
          }
          const { userCancelCallback, ariaLabel } = option
          const dialogRef = uiService.showDialog(data, {
            hasBackdrop: false,
            position: { top: '5px'},
            ariaLabel
          })

          dialogRef.afterClosed().subscribe(closeReason => {
            if (closeReason && closeReason.programmatic) return
            if (closeReason && closeReason === actionBtn) return userCancelCallback()
            if (!closeReason) return userCancelCallback()
          })

          return () => {
            dialogRef.close({ userInitiated: false, programmatic: true })
          }
        } 
      },
      deps: [ UIService ]
    },

    {
      provide: IAV_DATASET_PREVIEW_ACTIVE,
      useFactory: (glue: DatasetPreviewGlue) => glue.datasetPreviewDisplayed.bind(glue),
      deps: [ DatasetPreviewGlue ]
    },
    {
      provide: GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME,
      useFactory: (glue: DatasetPreviewGlue) => glue.getDatasetPreviewFromId.bind(glue),
      deps: [ DatasetPreviewGlue ]
    },
    DatasetPreviewGlue,

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
    // bandaid fix: required to init glueService on startup
    // TODO figure out why, then init service without this hack
    glueService: DatasetPreviewGlue
  ) {
    authServce.authReloadState()
  }
}
