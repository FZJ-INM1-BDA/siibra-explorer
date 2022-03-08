import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { Observable } from "rxjs";
import { AtlasCmpParcellationModule } from "src/atlasComponents/parcellation";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { SplashUiModule } from "src/atlasComponents/splashScreen";
import { ComponentsModule } from "src/components";
import { ContextMenuModule, ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { LayoutModule } from "src/layouts/layout.module";
import { AngularMaterialModule } from "src/sharedModules";
import { TopMenuModule } from "src/ui/topMenu/module";
import { CONTEXT_MENU_ITEM_INJECTOR, TContextMenu, UtilModule } from "src/util";
import { NehubaModule, NehubaViewerUnit } from "./nehuba";
import { ThreeSurferModule } from "./threeSurfer";
import { ViewerCmp } from "./viewerCmp/viewerCmp.component";
import { UserAnnotationsModule } from "src/atlasComponents/userAnnotations";
import { QuickTourModule } from "src/ui/quickTour/module";
import { INJ_ANNOT_TARGET } from "src/atlasComponents/userAnnotations/tools/type";
import { NEHUBA_INSTANCE_INJTKN } from "./nehuba/util";
import { map } from "rxjs/operators";
import { TContextArg } from "./viewer.interface";
import { ViewerStateBreadCrumbModule } from "./viewerStateBreadCrumb/module";
import { API_SERVICE_SET_VIEWER_HANDLE_TOKEN, AtlasViewerAPIServices, setViewerHandleFactory } from "src/atlasViewer/atlasViewer.apiService.service";
import { ILoadMesh, LOAD_MESH_TOKEN } from "src/messaging/types";
import { KeyFrameModule } from "src/keyframesModule/module";
import { ViewerInternalStateSvc } from "./viewerInternalState.service";
import { LayerBrowserModule } from "src/ui/layerbrowser";
import { SAPIModule } from 'src/atlasComponents/sapi';
import { NehubaVCtxToBbox } from "./pipes/nehubaVCtxToBbox.pipe";
import { SapiViewsModule, SapiViewsUtilModule } from "src/atlasComponents/sapiViews";

@NgModule({
  imports: [
    CommonModule,
    NehubaModule,
    ThreeSurferModule,
    LayoutModule,
    AngularMaterialModule,
    SplashUiModule,
    TopMenuModule,
    ParcellationRegionModule,
    UtilModule,
    AtlasCmpParcellationModule,
    ComponentsModule,
    UserAnnotationsModule,
    QuickTourModule,
    ContextMenuModule,
    ViewerStateBreadCrumbModule,
    KeyFrameModule,
    LayerBrowserModule,
    SAPIModule,
    SapiViewsModule,
    SapiViewsUtilModule
  ],
  declarations: [
    ViewerCmp,
    NehubaVCtxToBbox,
  ],
  providers: [
    {
      provide: INJ_ANNOT_TARGET,
      useFactory: (obs$: Observable<NehubaViewerUnit>) => {
        return obs$.pipe(
          map(unit => unit?.elementRef?.nativeElement)
        )
      },
      deps: [
        NEHUBA_INSTANCE_INJTKN
      ]
    },
    {
      provide: CONTEXT_MENU_ITEM_INJECTOR,
      useFactory: (svc: ContextMenuService<TContextArg<'threeSurfer' | 'nehuba'>>) => {
        return {
          register: svc.register.bind(svc),
          deregister: svc.deregister.bind(svc)
        } as TContextMenu<TContextMenuReg<TContextArg<'nehuba' | 'threeSurfer'>>>
      },
      deps: [ ContextMenuService ]
    },
    {
      provide: API_SERVICE_SET_VIEWER_HANDLE_TOKEN,
      useFactory: setViewerHandleFactory,
      deps: [ AtlasViewerAPIServices ]
    },
    {
      provide: LOAD_MESH_TOKEN,
      useFactory: (apiService: AtlasViewerAPIServices) => {
        return (loadMeshParam: ILoadMesh) => apiService.loadMesh$.next(loadMeshParam)
      },
      deps: [
        AtlasViewerAPIServices
      ]
    },
    AtlasViewerAPIServices,
    ViewerInternalStateSvc,
  ],
  exports: [
    ViewerCmp,
  ],
})

export class ViewerModule{}
