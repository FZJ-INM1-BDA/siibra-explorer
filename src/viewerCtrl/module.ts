import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { ViewerCtrlCmp } from "./viewerCtrlCmp/viewerCtrlCmp.component";

// Migrate to viewer specific submodule when merged to dev

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  declarations: [
    ViewerCtrlCmp,
  ],
  exports: [
    ViewerCtrlCmp
  ]
})

export class ViewerCtrlModule{}