import { APP_INITIALIZER, NgModule } from "@angular/core";
import { NehubaViewerContainerDirective } from './nehubaViewerInterface/nehubaViewerInterface.directive'
import { NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { CommonModule } from "@angular/common";
import { NEHUBA_INSTANCE_INJTKN } from "./util";
import { NehubaViewerTouchDirective } from "./nehubaViewerInterface/nehubaViewerTouch.directive";
import { StoreModule } from "@ngrx/store";
import { NEHUBA_VIEWER_FEATURE_KEY } from "./constants";
import { reducer } from "./store";
import { NehubaGlueCmp } from "./nehubaViewerGlue/nehubaViewerGlue.component";
import { UtilModule } from "src/util";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { ShareModule } from "src/share";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BehaviorSubject } from "rxjs";
import { StateModule } from "src/state";
import { AuthModule } from "src/auth";
import { QuickTourModule } from "src/ui/quickTour/module";
import { WindowResizeModule } from "src/util/windowResize";
import { EffectsModule } from "@ngrx/effects";
import { MeshEffects } from "./mesh.effects/mesh.effects";
import { NehubaLayoutOverlayModule } from "./layoutOverlay";
import { NgAnnotationService } from "./annotation/service";
import { NehubaViewerContainer } from "./nehubaViewerInterface/nehubaViewerContainer.component";
import { NehubaUserLayerModule } from "./userLayers";
import { DialogModule } from "src/ui/dialogInfo";
import { CoordTextBox } from "src/components/coordTextBox";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { MediaQueryDirective } from "src/util/directives/mediaQuery.directive";
import { SapiViewsUtilModule } from "src/atlasComponents/sapiViews";
import { CoordinateText } from "src/components/coordTextBox/coordText.directive";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UtilModule,
    AngularMaterialModule,
    ComponentsModule,
    ShareModule,
    WindowResizeModule,
    NehubaUserLayerModule,
    MediaQueryDirective,

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
      MeshEffects,
    ]),
    QuickTourModule,
    NehubaLayoutOverlayModule,
    DialogModule,

    CoordTextBox,
    CoordinateText,
    ExperimentalFlagDirective,
    SapiViewsUtilModule,
  ],
  declarations: [
    NehubaViewerContainerDirective,
    NehubaViewerUnit,
    NehubaViewerTouchDirective,
    NehubaGlueCmp,
    NehubaViewerContainer,
  ],
  exports: [
    NehubaViewerUnit,
    NehubaViewerTouchDirective,
    NehubaGlueCmp,
  ],
  providers: [
    {
      provide: NEHUBA_INSTANCE_INJTKN,
      useValue: new BehaviorSubject(null)
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (_svc: NgAnnotationService) => () => Promise.resolve(),
      deps: [ NgAnnotationService ]
    },
    NgAnnotationService
  ]
})

export class NehubaModule{}
