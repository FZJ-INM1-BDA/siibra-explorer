import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { ViewerCtrlCmp } from "./viewerCtrlCmp/viewerCtrlCmp.component";
import { PerspectiveViewSlider } from "./perspectiveViewSlider/perspectiveViewSlider.component";
import { PerspectiveViewSliderDirective } from "./perspectiveViewSlider/perspectiveViewSlider.directive";
import { NavigationPosToTextPipe } from "./perspectiveViewSlider/navigationPosToTextPipe.pipe";
import { SnapPerspectiveOrientationCmp } from "src/viewerModule/nehuba/viewerCtrl/snapPerspectiveOrientation/snapPerspectiveOrientation.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
  ],
  declarations: [
    ViewerCtrlCmp,
    PerspectiveViewSlider,
    PerspectiveViewSliderDirective,
    NavigationPosToTextPipe,
    SnapPerspectiveOrientationCmp,
  ],
  exports: [
    ViewerCtrlCmp,
    PerspectiveViewSlider
  ]
})

export class ViewerCtrlModule{}
