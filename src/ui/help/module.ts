import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "src/sharedModules";
import { AboutCmp } from './about/about.component'
import { HelpOnePager } from "./helpOnePager/helpOnePager.component";
import {QuickTourModule} from "src/ui/quickTour/module";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    ComponentsModule,
    UtilModule,
    QuickTourModule
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
