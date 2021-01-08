import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "../sharedModules/angularMaterial.module";
import { AboutCmp } from './about/about.component'
import { HelpOnePager } from "./helpOnePager/helpOnePager.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    ComponentsModule,
    UtilModule,
  ],
  declarations: [
    AboutCmp,
    HelpOnePager,
  ],
  exports: [
    AboutCmp,
    HelpOnePager,
  ]
})

export class HelpModule{}