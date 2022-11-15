import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { ViewerCtrlCmp } from "./viewerCtrlCmp/viewerCtrlCmp.component";
import { ChangePerspectiveOrientationComponent } from "./change-perspective-orientation/changePerspectiveOrientation.component";
import { PerspectiveViewSlider } from "./perspectiveViewSlider/perspectiveViewSlider.component";
import { PerspectiveViewSliderDirective } from "./perspectiveViewSlider/perspectiveViewSlider.directive";
import { NavigationPosToTextPipe } from "./perspectiveViewSlider/navigationPosToTextPipe.pipe";

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
    ChangePerspectiveOrientationComponent,
    PerspectiveViewSlider,
    PerspectiveViewSliderDirective,
    NavigationPosToTextPipe,
  ],
  exports: [
    ViewerCtrlCmp,
    PerspectiveViewSlider
  ]
})

export class ViewerCtrlModule{}
