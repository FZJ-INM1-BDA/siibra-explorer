import { CommonModule } from "@angular/common";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { LoggingModule } from "src/logging";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { IFrameSrcPipe } from "./iframeSrc.pipe";
import { PluginBannerUI } from "./pluginBanner/pluginBanner.component";
import { PluginPortal } from "./pluginPortal/pluginPortal.component";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { DialogModule } from "src/ui/dialogInfo";
import { FileInputModule } from "src/getFileInput/module";
import { MarkdownModule } from "src/components/markdown";


@NgModule({
  imports: [
    CommonModule,
    LoggingModule,
    UtilModule,
    AngularMaterialModule,
    ExperimentalFlagDirective,
    DialogModule,
    FileInputModule,
    MarkdownModule,
  ],
  declarations: [
    PluginBannerUI,
    PluginPortal,
    IFrameSrcPipe,
  ],
  exports: [
    PluginBannerUI,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class PluginModule{}