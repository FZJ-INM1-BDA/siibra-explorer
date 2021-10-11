import { FullscreenOverlayContainer, OverlayContainer } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "src/sharedModules";
import { ScreenshotCmp } from "./screenshotCmp/screenshot.component";
import { ScreenshotSwitch } from "./screenshotSwitch.directive";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
  ],
  declarations:[
    ScreenshotSwitch,
    ScreenshotCmp,
  ],
  exports: [
    ScreenshotSwitch,
  ],
  providers:[{
    provide: OverlayContainer,
    useClass: FullscreenOverlayContainer
  }]
})

export class ScreenshotModule{}
