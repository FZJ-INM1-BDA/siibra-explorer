import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { ThreeSurferGlueCmp } from "./threeSurferGlue/threeSurfer.component";
import { ThreeSurferViewerConfig } from "./tsViewerConfig/tsViewerConfig.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  declarations: [
    ThreeSurferGlueCmp,
    ThreeSurferViewerConfig,
  ],
  exports: [
    ThreeSurferGlueCmp,
  ]
})

export class ThreeSurferModule{}
