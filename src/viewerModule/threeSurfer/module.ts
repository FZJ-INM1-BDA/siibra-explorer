import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { ThreeSurferGlueCmp } from "./threeSurferGlue/threeSurfer.component";
import { ThreeSurferViewerConfig } from "./tsViewerConfig/tsViewerConfig.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    FormsModule,
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
