import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { BsFeatureService } from "../service";
import { BsFeatureIEEGCmp } from "./ieegCmp/ieeg.component";
import { BsFeatureIEEGDirective } from "./ieegCtrl.directive";
import { IEEG_FEATURE_NAME } from "./type";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    UtilModule,
    AngularMaterialModule,
  ],
  declarations: [
    BsFeatureIEEGCmp,
    BsFeatureIEEGDirective
  ]
})

export class BsFeatureIEEGModule{
  constructor(svc: BsFeatureService){
    svc.registerFeature({
      name: IEEG_FEATURE_NAME,
      icon: 'fas fa-info',
      View: BsFeatureIEEGCmp,
      Ctrl: BsFeatureIEEGDirective
    })
  }
}
