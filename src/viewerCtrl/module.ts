import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { ViewerCtrlCmp } from "./viewerCtrlCmp/viewerCtrlCmp.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    FormsModule,
    ComponentsModule,
  ],
  declarations: [
    ViewerCtrlCmp,
  ],
  exports: [
    ViewerCtrlCmp
  ]
})

export class ViewerCtrlModule{}