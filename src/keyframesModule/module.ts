import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { KeyFrameDirective } from "./keyframe.directive";
import { KeyFrameCtrlCmp } from "./keyframeCtrl/keyframeCtrl.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    ComponentsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    KeyFrameCtrlCmp,
    KeyFrameDirective,
  ],
  exports: [
    KeyFrameCtrlCmp,
    KeyFrameDirective,
  ]
})

export class KeyFrameModule{}