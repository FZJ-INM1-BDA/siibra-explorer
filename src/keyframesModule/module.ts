import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { KeyFrameDirective } from "./keyframe.directive";
import { KeyFrameCtrlCmp } from "./keyframeCtrl/keyframeCtrl.component";
import { KeyFrameService } from "./service";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    ComponentsModule,
    FormsModule,
  ],
  declarations: [
    KeyFrameCtrlCmp,
    KeyFrameDirective,
  ],
  exports: [
    KeyFrameCtrlCmp,
    KeyFrameDirective,
  ],
  providers: [
    KeyFrameService,
  ]
})

export class KeyFrameModule{}