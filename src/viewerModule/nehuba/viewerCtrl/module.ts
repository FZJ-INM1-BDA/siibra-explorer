import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { ViewerCtrlCmp } from "./viewerCtrlCmp/viewerCtrlCmp.component";
import { PerspectiveViewSlider } from "./perspectiveViewSlider/perspectiveViewSlider.component";
import { PerspectiveViewSliderDirective } from "./perspectiveViewSlider/perspectiveViewSlider.directive";
import { PerspectiveViewRangeValue } from "./perspectiveViewSlider/perspectiveViewRangeValue.pipe";

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
    PerspectiveViewRangeValue
  ],
  exports: [
    ViewerCtrlCmp,
    PerspectiveViewSlider
  ]
})

export class ViewerCtrlModule{}
