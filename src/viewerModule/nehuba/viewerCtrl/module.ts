import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { ViewerCtrlCmp } from "./viewerCtrlCmp/viewerCtrlCmp.component";
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
    SnapPerspectiveOrientationCmp
  ],
  exports: [
    ViewerCtrlCmp
  ]
})

export class ViewerCtrlModule{}
