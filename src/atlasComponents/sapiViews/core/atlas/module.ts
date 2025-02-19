import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SpinnerModule } from "src/components/spinner";
import { SapiViewsCoreAtlasSplashScreen } from "./splashScreen/splashScreen.component";
import { SAPIModule } from "src/atlasComponents/sapi/module";
import { AngularMaterialModule } from "src/sharedModules";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SpinnerModule,
    SAPIModule,
  ],
  declarations: [
    SapiViewsCoreAtlasSplashScreen,
  ],
  exports: [
    SapiViewsCoreAtlasSplashScreen,
  ]
})

export class SapiViewsCoreAtlasModule{}
