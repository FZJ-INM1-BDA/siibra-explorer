import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SpinnerModule } from "src/components/spinner";
import { SapiViewsCoreAtlasSplashScreen } from "./splashScreen/splashScreen.component";
import { MatCardModule } from "@angular/material/card";
import { SAPIModule } from "src/atlasComponents/sapi/module";
import { MatRippleModule } from "@angular/material/core";

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatRippleModule,
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
