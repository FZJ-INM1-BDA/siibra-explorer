import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { SapiViewsCoreSpaceBoundingBox } from "./boundingBox.directive";
import { AngularMaterialModule } from "src/sharedModules";
import { DialogModule } from "src/ui/dialogInfo/module";
import { SapiViewsUtilModule } from "../../util";
import {UtilModule} from "src/util";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    AngularMaterialModule,
    DialogModule,
    SapiViewsUtilModule,
    UtilModule
  ],
  declarations: [
    SapiViewsCoreSpaceBoundingBox,
  ],
  exports: [
    SapiViewsCoreSpaceBoundingBox,
  ]
})

export class SapiViewsCoreSpaceModule{}
