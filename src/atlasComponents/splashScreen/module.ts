import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { KgTosModule } from "src/ui/kgtos/module";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { SplashScreen } from "./splashScreen/splashScreen.component";

@NgModule({
  imports: [
    AngularMaterialModule,
    CommonModule,
    UtilModule,
    KgTosModule,
    ComponentsModule,
  ],
  declarations: [
    SplashScreen,
  ],
  exports: [
    SplashScreen,
  ]
})

export class SplashUiModule{}