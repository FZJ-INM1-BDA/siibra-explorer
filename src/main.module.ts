import { DragDropModule } from '@angular/cdk/drag-drop'
import { CommonModule, DOCUMENT } from "@angular/common";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Store, select } from "@ngrx/store";
import { AngularMaterialModule } from 'src/sharedModules'
import { AtlasViewer } from "./atlasViewer/atlasViewer.component";
import { ComponentsModule } from "./components/components.module";
import { LayoutModule } from "./layouts/layout.module";
import { UIModule } from "./ui/ui.module";

import { HttpClientModule } from "@angular/common/http";
import { AtlasWorkerService } from "./atlasViewer/atlasViewer.workerService.service";
import { WINDOW_MESSAGING_HANDLER_TOKEN } from 'src/messaging/types'

import { DialogService } from "./services/dialogService.service";
import { UIService } from "./services/uiService.service";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR, UtilModule } from "src/util";
import { SpotLightModule } from 'src/spotlight/spot-light.module'
import { TryMeComponent } from "./ui/tryme/tryme.component";
import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service";
import { WidgetModule } from 'src/widget';
import { PluginModule } from './plugin/plugin.module';
import { LoggingModule } from './logging/logging.module';
import { AuthService } from './auth'

import { ClickInterceptorService } from './glue';
import { TOS_OBS_INJECTION_TOKEN } from './ui/kgtos';
import { MesssagingModule } from './messaging/module';
import { ViewerModule } from './viewerModule';
import { CookieModule } from './ui/cookieAgreement/module';
import { KgTosModule } from './ui/kgtos/module';
import { AtlasViewerRouterModule } from './routerModule';
import { MessagingGlue } from './messagingGlue';
import { QuickTourModule } from './ui/quickTour';
import { of } from 'rxjs';
import { CANCELLABLE_DIALOG, CANCELLABLE_DIALOG_OPTS } from './util/interfaces';
import { NotSupportedCmp } from './notSupportedCmp/notSupported.component';
import {
  atlasSelection,
  RootStoreModule,
  getStoreEffects,
} from "./state"
import { DARKTHEME } from './util/injectionTokens';
import { map } from 'rxjs/operators';
import { EffectsModule } from '@ngrx/effects';

// TODO check if there is a more logical place import put layerctrl effects ts
import { LayerCtrlEffects } from './viewerModule/nehuba/layerCtrl.service/layerCtrl.effects';
import { NehubaNavigationEffects } from './viewerModule/nehuba/navigation.service/navigation.effects';
import { CONST } from "common/constants"
import { ViewerCommonEffects } from './viewerModule';
import { environment } from './environments/environment';
import { SAPI } from './atlasComponents/sapi';
import { GET_ATTR_TOKEN, GetAttr } from './util/constants';
import { KCodeModule } from "./experimental/experimental.module"

@NgModule({
  imports: [
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
    CookieModule,
    KgTosModule,
    AtlasViewerRouterModule,
    QuickTourModule,
    
    EffectsModule.forRoot([
      ...getStoreEffects(),
      LayerCtrlEffects,
      NehubaNavigationEffects,
      ViewerCommonEffects,
    ]),
    RootStoreModule,
    HttpClientModule,
    KCodeModule,
  ],
  declarations: [
    AtlasViewer,
    NotSupportedCmp,
    TryMeComponent,
    /* directives */
  ],
  providers: [
    AtlasWorkerService,
    AuthService,
    DialogService,
    UIService,
    InterSpaceCoordXformSvc,
    ClickInterceptorService,
    {
      provide: CANCELLABLE_DIALOG,
      useFactory: (uiService: UIService) => {
        return (message: string, option: CANCELLABLE_DIALOG_OPTS) => {
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
      provide: TOS_OBS_INJECTION_TOKEN,
      useValue: of(CONST.KG_TOS)
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
      provide: WINDOW_MESSAGING_HANDLER_TOKEN,
      useClass: MessagingGlue
    },
    {
      provide: DARKTHEME,
      useFactory: (store: Store) => store.pipe(
        select(atlasSelection.selectors.selectedTemplate),
        map(tmpl => !!(tmpl && tmpl.id !== 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588')),
      ),
      deps: [ Store ]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (authSvc: AuthService) => {
        authSvc.authReloadState()
        return () => Promise.resolve()
      },
      multi: true,
      deps: [ AuthService ]
    },
    {
      provide: GET_ATTR_TOKEN,
      useFactory: (document: Document) => {
        return (attr: string) => {
          const rootEl = document.querySelector("atlas-viewer")
          return rootEl?.getAttribute(attr)
        }
      },
      deps: [ DOCUMENT ]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (sapi: SAPI, getAttr: GetAttr) => {
        const overwriteSapiUrl = getAttr(CONST.OVERWRITE_SAPI_ENDPOINT_ATTR)
        
        const { SIIBRA_API_ENDPOINTS } = environment
        const endpoints = (overwriteSapiUrl && [ overwriteSapiUrl ]) || SIIBRA_API_ENDPOINTS.split(',')
        return async () => {
          try {
            const url = await SAPI.VerifyEndpoints(endpoints)
            sapi.verifiedSapiEndpoint$.next(url)
            sapi.verifiedSapiEndpoint$.complete()
          } catch (e) {
            SAPI.ErrorMessage = e.toString()
          }
        }
      },
      multi: true,
      deps: [ SAPI, GET_ATTR_TOKEN ]
    }
  ],
  bootstrap: [
    AtlasViewer,
  ]
})

export class MainModule {}
