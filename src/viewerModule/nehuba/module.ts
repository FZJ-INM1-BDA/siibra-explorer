import { NgModule } from "@angular/core";
import { NehubaViewerContainerDirective } from './nehubaViewerInterface/nehubaViewerInterface.directive'
import { IMPORT_NEHUBA_INJECT_TOKEN, NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { CommonModule } from "@angular/common";
import { APPEND_SCRIPT_TOKEN } from "src/util/constants";
import { importNehubaFactory, NEHUBA_INSTANCE_INJTKN } from "./util";
import { NehubaViewerTouchDirective } from "./nehubaViewerInterface/nehubaViewerTouch.directive";
import { StoreModule } from "@ngrx/store";
import { NEHUBA_VIEWER_FEATURE_KEY } from "./constants";
import { reducer } from "./store";
import { NehubaGlueCmp } from "./nehubaViewerGlue/nehubaViewerGlue.component";
import { UtilModule } from "src/util";
import { LayoutModule } from "src/layouts/layout.module";
import { TouchSideClass } from "./touchSideClass.directive";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { MaximisePanelButton } from "./maximisePanelButton/maximisePanelButton.component";
import { Landmark2DModule } from "src/ui/nehubaContainer/2dLandmarks/module";
import { MouseoverModule } from "src/mouseoverModule";
import { StatusCardComponent } from "./statusCard/statusCard.component";
import { ShareModule } from "src/share";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BehaviorSubject } from "rxjs";
import { StateModule } from "src/state";
import { AuthModule } from "src/auth";
import {QuickTourModule} from "src/ui/quickTour/module";
import { WindowResizeModule } from "src/util/windowResize";
import { ViewerCtrlModule } from "./viewerCtrl";
import { DragDropFileModule } from "src/dragDropFile/module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UtilModule,
    LayoutModule,
    AngularMaterialModule,
    Landmark2DModule,
    ComponentsModule,
    MouseoverModule,
    ShareModule,
    WindowResizeModule,
    ViewerCtrlModule,
    DragDropFileModule,

    /**
     * should probably break this into its own...
     * share url module or something?
     */
    StateModule,
    AuthModule,
    StoreModule.forFeature(
      NEHUBA_VIEWER_FEATURE_KEY,
      reducer
    ),
    QuickTourModule
  ],
  declarations: [
    NehubaViewerContainerDirective,
    NehubaViewerUnit,
    NehubaViewerTouchDirective,
    NehubaGlueCmp,
    TouchSideClass,
    MaximisePanelButton,
    StatusCardComponent,
  ],
  exports: [
    NehubaViewerUnit,
    NehubaViewerTouchDirective,
    NehubaGlueCmp,
    StatusCardComponent,
  ],
  providers: [
    {
      provide: IMPORT_NEHUBA_INJECT_TOKEN,
      useFactory: importNehubaFactory,
      deps: [ APPEND_SCRIPT_TOKEN ]
    },
    {
      provide: NEHUBA_INSTANCE_INJTKN,
      useValue: new BehaviorSubject(null)
    }
  ]
})

export class NehubaModule{}
