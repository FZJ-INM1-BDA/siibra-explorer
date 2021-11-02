import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { ThreeSurferGlueCmp } from "./threeSurferGlue/threeSurfer.component";
import { ThreeSurferViewerConfig } from "./tsViewerConfig/tsViewerConfig.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    FormsModule,
    ComponentsModule,
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
