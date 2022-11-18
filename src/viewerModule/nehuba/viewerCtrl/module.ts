import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { ViewerCtrlCmp } from "./viewerCtrlCmp/viewerCtrlCmp.component";
import { PerspectiveViewSlider } from "./perspectiveViewSlider/perspectiveViewSlider.component";
import { SnapPerspectiveOrientationCmp } from "src/viewerModule/nehuba/viewerCtrl/snapPerspectiveOrientation/snapPerspectiveOrientation.component";
import { WindowResizeModule } from "src/util/windowResize";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    WindowResizeModule,
  ],
  declarations: [
    ViewerCtrlCmp,
    PerspectiveViewSlider,
    SnapPerspectiveOrientationCmp,
  ],
  exports: [
    ViewerCtrlCmp,
    PerspectiveViewSlider
  ]
})

export class ViewerCtrlModule{}
