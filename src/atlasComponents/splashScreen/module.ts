import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { KgTosModule } from "src/ui/kgtos/module";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { GetTemplateImageSrcPipe, SplashScreen } from "./splashScreen/splashScreen.component";

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
    GetTemplateImageSrcPipe,
  ],
  exports: [
    SplashScreen,
  ]
})

export class SplashUiModule{}