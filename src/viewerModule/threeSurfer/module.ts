import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { StoreModule } from "@ngrx/store";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { ThreeSurferGlueCmp } from "./threeSurferGlue/threeSurfer.component";
import { ThreeSurferViewerConfig } from "./tsViewerConfig/tsViewerConfig.component";
import { nameSpace, reducer, ThreeSurferEffects } from "./store"
import { EffectsModule } from "@ngrx/effects";
import { TmpThreeSurferLifeCycle } from "./lifecycle/lifecycle.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { ExperimentalModule } from "src/experimental/experimental.module";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    FormsModule,
    ComponentsModule,
    MatSlideToggleModule,
    ExperimentalModule,
    StoreModule.forFeature(
      nameSpace,
      reducer
    ),
    EffectsModule.forFeature([
      ThreeSurferEffects,
    ])
  ],
  declarations: [
    ThreeSurferGlueCmp,
    ThreeSurferViewerConfig,
    TmpThreeSurferLifeCycle,
  ],
  exports: [
    TmpThreeSurferLifeCycle,
  ]
})

export class ThreeSurferModule{}
