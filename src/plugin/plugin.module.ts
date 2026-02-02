import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { LoggingModule } from "src/logging";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { IFrameSrcPipe } from "./iframeSrc.pipe";
import { PluginBannerUI } from "./pluginBanner/pluginBanner.component";
import { PluginPortal } from "./pluginPortal/pluginPortal.component";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { PluginDisabledReasons } from "./pluginEnabled.pipe";


@NgModule({
  imports: [
    CommonModule,
    LoggingModule,
    UtilModule,
    AngularMaterialModule,
    HttpClientModule,
    ExperimentalFlagDirective,
],
  declarations: [
    PluginBannerUI,
    PluginPortal,
    IFrameSrcPipe,
    PluginDisabledReasons,
  ],
  exports: [
    PluginBannerUI,
  ],
  providers: []
})
export class PluginModule{}