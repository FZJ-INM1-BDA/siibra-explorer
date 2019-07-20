import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {AngularMaterialModule} from 'src/ui/sharedModules/angularMaterial.module'

import {AppComponent} from "src/app.component";
import {AppRoutingModule} from "src/app-routing.module";
import {BrowserModule} from "@angular/platform-browser";
import {EffectsModule} from "@ngrx/effects";
import {UseEffects} from "src/services/effect/effect";
import {select, Store, StoreModule} from "@ngrx/store";
import {pluginState} from "src/services/state/pluginState.store";
import {viewerConfigState, ViewerConfiguration} from "src/services/state/viewerConfig.store";
import {ngViewerState} from "src/services/state/ngViewerState.store";
import {viewerState} from "src/services/state/viewerState.store";
import {dataStore} from "src/services/state/dataStore.store";
import {spatialSearchState} from "src/services/state/spatialSearchState.store";
import {uiState} from "src/services/state/uiState.store";
import {LayoutModule} from "src/layouts/layout.module";
import {ComponentsModule} from "src/components/components.module";
import {DragDropModule} from "@angular/cdk/drag-drop";
import {UIModule} from "src/ui/ui.module";
import {ModalModule, TabsModule, TooltipModule} from "ngx-bootstrap";
import {HttpClientModule} from "@angular/common/http";
import {AtlasViewer} from "src/atlasViewer/atlasViewer.component";
import {WidgetUnit} from "src/atlasViewer/widgetUnit/widgetUnit.component";
import {ModalUnit} from "src/atlasViewer/modalUnit/modalUnit.component";
import {PluginUnit} from "src/atlasViewer/pluginUnit/pluginUnit.component";
import {
    fasTooltipInfoSignDirective,
    fasTooltipLogInDirective,
    fasTooltipNewWindowDirective,
    fasTooltipQuestionSignDirective,
    fasTooltipRemoveDirective, fasTooltipRemoveSignDirective,
    fasTooltipScreenshotDirective
} from "src/util/directives/glyphiconTooltip.directive";
import {HelpDirective} from "src/util/directives/help.directive";
import {ToastContainerDirective} from "src/util/directives/toastContainer.directive";
import {DockedContainerDirective} from "src/util/directives/dockedContainer.directive";
import {FloatingContainerDirective} from "src/util/directives/floatingContainer.directive";
import {PluginFactoryDirective} from "src/util/directives/pluginFactory.directive";
import {FloatingMouseContextualContainerDirective} from "src/util/directives/floatingMouseContextualContainer.directive";
import {FixedMouseContextualContainerDirective} from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import {GetNamesPipe} from "src/util/pipes/getNames.pipe";
import {GetNamePipe} from "src/util/pipes/getName.pipe";
import {TransformOnhoverSegmentPipe} from "src/atlasViewer/onhoverSegment.pipe";
import {GetFilenameFromPathnamePipe} from "src/util/pipes/getFileNameFromPathName.pipe";
import {NewViewerDisctinctViewToLayer} from "src/util/pipes/newViewerDistinctViewToLayer.pipe";
import {ToastComponent} from "src/components/toast/toast.component";
import {AtlasViewerDataService} from "src/atlasViewer/atlasViewer.dataService.service";
import {WidgetServices} from "src/atlasViewer/widgetUnit/widgetService.service";
import {AtlasViewerURLService} from "src/atlasViewer/atlasViewer.urlService.service";
import {AtlasViewerAPIServices} from "src/atlasViewer/atlasViewer.apiService.service";
import {ToastService} from "src/services/toastService.service";
import {AtlasWorkerService} from "src/atlasViewer/atlasViewer.workerService.service";
import {AuthService} from "src/services/auth.service";
import {DatabrowserService} from "src/ui/databrowserModule/databrowser.service";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {HelpPageModule} from "src/ui/helpPage/helpPage.module";

@NgModule({
    imports: [
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,

        LayoutModule,
        ComponentsModule,
        DragDropModule,
        UIModule,
        AngularMaterialModule,

        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        TabsModule.forRoot(),
        EffectsModule.forRoot([
            UseEffects
        ]),
        StoreModule.forRoot({
                pluginState,
                viewerConfigState,
                ngViewerState,
                viewerState,
                dataStore,
                spatialSearchState,
                uiState,
            }
        ),
        HttpClientModule,
        AppRoutingModule,
        HelpPageModule
    ],


    entryComponents: [
        WidgetUnit,
        ModalUnit,
        ToastComponent,
        PluginUnit,
        ///////////////////////////AtlasViewer///////////////////
    ],
    providers: [
        AtlasViewerDataService,
        WidgetServices,
        AtlasViewerURLService,
        AtlasViewerAPIServices,
        ToastService,
        AtlasWorkerService,
        AuthService,

        /**
         * TODO
         * once nehubacontainer is separated into viewer + overlay, migrate to nehubaContainer module
         */
        DatabrowserService
    ],
    declarations: [
        AppComponent,

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
        GetFilenameFromPathnamePipe,
        NewViewerDisctinctViewToLayer

    ],
    bootstrap: [
        AppComponent
    ]
})

export class MainModule {

    constructor(
        authServce: AuthService,
        store: Store<ViewerConfiguration>,
        /**
         * instantiate singleton
         * allow for pre fetching of dataentry
         * TODO only fetch when traffic is idle
         */
        dbSerivce: DatabrowserService
    ) {
        authServce.authReloadState()
        store.pipe(
            select('viewerConfigState')
        ).subscribe(({gpuLimit}) => {
            if (gpuLimit)
                window.localStorage.setItem('iv-gpulimit', gpuLimit.toString())
        })
    }
}