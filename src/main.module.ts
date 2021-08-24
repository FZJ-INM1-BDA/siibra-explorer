import { DragDropModule } from '@angular/cdk/drag-drop'
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { StoreModule, ActionReducer } from "@ngrx/store";
import { AngularMaterialModule } from 'src/sharedModules'
import { AtlasViewer } from "./atlasViewer/atlasViewer.component";
import { ComponentsModule } from "./components/components.module";
import { LayoutModule } from "./layouts/layout.module";
import { ngViewerState, pluginState, uiState, userConfigState, UserConfigStateUseEffect, viewerConfigState, viewerState } from "./services/stateStore.service";
import { UIModule } from "./ui/ui.module";

import { HttpClientModule } from "@angular/common/http";
import { EffectsModule } from "@ngrx/effects";
import { AtlasWorkerService } from "./atlasViewer/atlasViewer.workerService.service";
import { WINDOW_MESSAGING_HANDLER_TOKEN } from 'src/messaging/types'

import { ConfirmDialogComponent } from "./components/confirmDialog/confirmDialog.component";
import { DialogComponent } from "./components/dialog/dialog.component";
import { DialogService } from "./services/dialogService.service";
import { UseEffects } from "./services/effect/effect";
import { LocalFileService } from "./services/localFile.service";
import { NgViewerUseEffect } from "./services/state/ngViewerState.store";
import { ViewerStateUseEffect } from "./services/state/viewerState.store";
import { UIService } from "./services/uiService.service";
import { ViewerStateControllerUseEffect } from "src/state";
import { FloatingContainerDirective } from "./util/directives/floatingContainer.directive";
import { FloatingMouseContextualContainerDirective } from "./util/directives/floatingMouseContextualContainer.directive";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR, PureContantService, UtilModule } from "src/util";
import { SpotLightModule } from 'src/spotlight/spot-light.module'
import { TryMeComponent } from "./ui/tryme/tryme.component";
import { UiStateUseEffect } from "src/services/state/uiState.store";
import { PluginServiceUseEffect } from './services/effect/pluginUseEffect';
import { TemplateCoordinatesTransformation } from "src/services/templateCoordinatesTransformation.service";
import { NewTemplateUseEffect } from './services/effect/newTemplate.effect';
import { WidgetModule } from 'src/widget';
import { PluginModule } from './plugin/plugin.module';
import { LoggingModule } from './logging/logging.module';
import { AuthService } from './auth'

import 'src/theme.scss'
import { DatasetPreviewGlue, datasetPreviewMetaReducer, IDatasetPreviewGlue, GlueEffects, ClickInterceptorService } from './glue';
import { viewerStateHelperReducer, viewerStateMetaReducers, ViewerStateHelperEffect } from './services/state/viewerState.store.helper';
import { TOS_OBS_INJECTION_TOKEN } from './ui/kgtos';
import { UiEffects } from './services/state/uiState/ui.effects';
import { MesssagingModule } from './messaging/module';
import { ParcellationRegionModule } from './atlasComponents/parcellationRegion';
import { ViewerModule, VIEWERMODULE_DARKTHEME } from './viewerModule';
import { CookieModule } from './ui/cookieAgreement/module';
import { KgTosModule } from './ui/kgtos/module';
import { MouseoverModule } from './mouseoverModule/mouseover.module';
import { AtlasViewerRouterModule } from './routerModule';
import { MessagingGlue } from './messagingGlue';
import { BS_ENDPOINT } from './util/constants';
import { QuickTourModule } from './ui/quickTour';
import { of } from 'rxjs';
import { GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME, OVERRIDE_IAV_DATASET_PREVIEW_DATASET_FN, kgTos, IAV_DATASET_PREVIEW_ACTIVE } from './databrowser.fallback'
import { CANCELLABLE_DIALOG } from './util/interfaces';
import { environment } from 'src/environments/environment' 

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
    
    AngularMaterialModule,
    UtilModule,
    WidgetModule,
    PluginModule,
    LoggingModule,
    MesssagingModule,
    ViewerModule,
    SpotLightModule,
    ParcellationRegionModule,
    CookieModule,
    KgTosModule,
    MouseoverModule,
    AtlasViewerRouterModule,
    QuickTourModule,
    
    EffectsModule.forRoot([
      UseEffects,
      UserConfigStateUseEffect,
      ViewerStateControllerUseEffect,
      ViewerStateUseEffect,
      NgViewerUseEffect,
      PluginServiceUseEffect,
      UiStateUseEffect,
      NewTemplateUseEffect,
      ViewerStateHelperEffect,
      GlueEffects,
      UiEffects,
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
      ]
    }),
    HttpClientModule,
  ],
  declarations : [
    AtlasViewer,
    TryMeComponent,

    /* directives */
    FloatingContainerDirective,
    FloatingMouseContextualContainerDirective,

  ],
  entryComponents : [
    DialogComponent,
    ConfirmDialogComponent,
  ],
  providers : [
    AtlasWorkerService,
    AuthService,
    LocalFileService,
    DialogService,
    UIService,
    TemplateCoordinatesTransformation,
    ClickInterceptorService,
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
    
    {
      provide: TOS_OBS_INJECTION_TOKEN,
      useValue: of(kgTos)
    },

    {
      provide: CLICK_INTERCEPTOR_INJECTOR,
      useFactory: (clickIntService: ClickInterceptorService) => {
        return {
          deregister: clickIntService.deregister.bind(clickIntService),
          register: (fn: (arg: any) => boolean, config?) => {
            if (config?.last) {
              clickIntService.register(fn)
            } else {
              clickIntService.register(fn, {
                first: true
              })
            }
          }
        } as ClickInterceptor
      },
      deps: [
        ClickInterceptorService
      ]
    },
    {
      provide: VIEWERMODULE_DARKTHEME,
      useFactory: (pureConstantService: PureContantService) => pureConstantService.darktheme$,
      deps: [ PureContantService ]
    },
    {
      provide: WINDOW_MESSAGING_HANDLER_TOKEN,
      useClass: MessagingGlue
    },
    {
      provide: BS_ENDPOINT,
      useValue: (environment.BS_REST_URL || `https://siibra-api-latest.apps-dev.hbp.eu/v1_0`).replace(/\/$/, '')
    },
  ],
  bootstrap : [
    AtlasViewer,
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
