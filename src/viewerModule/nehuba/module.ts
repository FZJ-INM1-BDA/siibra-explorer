import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
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
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { MouseoverModule } from "src/mouseoverModule";
import { StatusCardComponent } from "./statusCard/statusCard.component";
import { ShareModule } from "src/share";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BehaviorSubject } from "rxjs";
import { StateModule } from "src/state";
import { AuthModule } from "src/auth";
import {QuickTourModule} from "src/ui/quickTour/module";
import { WindowResizeModule } from "src/util/windowResize";
import { DragDropFileModule } from "src/dragDropFile/module";
import { NgLayerCtrlCmp } from "./ngLayerCtl/ngLayerCtrl.component";
import { EffectsModule } from "@ngrx/effects";
import { MeshEffects } from "./mesh.effects/mesh.effects";
import { NehubaLayoutOverlayModule } from "./layoutOverlay";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UtilModule,
    AngularMaterialModule,
    ComponentsModule,
    MouseoverModule,
    ShareModule,
    WindowResizeModule,
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
    EffectsModule.forFeature([
      MeshEffects
    ]),
    QuickTourModule,
    NehubaLayoutOverlayModule,
  ],
  declarations: [
    NehubaViewerContainerDirective,
    NehubaViewerUnit,
    NehubaViewerTouchDirective,
    NehubaGlueCmp,
    StatusCardComponent,
    NgLayerCtrlCmp,
  ],
  exports: [
    NehubaViewerUnit,
    NehubaViewerTouchDirective,
    NehubaGlueCmp,
    StatusCardComponent,
    NgLayerCtrlCmp,
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
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})

export class NehubaModule{}
