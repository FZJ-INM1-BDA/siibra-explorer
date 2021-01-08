import { CommonModule, DOCUMENT } from "@angular/common";
import { NgModule } from "@angular/core";
import { LoggingModule } from "src/logging";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { appendScriptFactory, APPEND_SCRIPT_TOKEN, removeScriptFactory, REMOVE_SCRIPT_TOKEN } from "src/util/constants";
import { PluginServices, registerPluginFactoryDirectiveFactory } from "./atlasViewer.pluginService.service";
import { PluginBannerUI } from "./pluginBanner/pluginBanner.component";
import { PluginCspCtrlCmp } from "./pluginCsp/pluginCsp.component";
import { PluginFactoryDirective, REGISTER_PLUGIN_FACTORY_DIRECTIVE } from "./pluginFactory.directive";
import { PluginUnit } from "./pluginUnit/pluginUnit.component";

@NgModule({
  imports: [
    CommonModule,
    LoggingModule,
    UtilModule,
    AngularMaterialModule,
  ],
  declarations: [
    PluginCspCtrlCmp,
    PluginUnit,
    PluginFactoryDirective,
    PluginBannerUI,
  ],
  exports: [
    PluginCspCtrlCmp,
    PluginBannerUI,
    PluginUnit,
    PluginFactoryDirective,
  ],
  providers: [

    PluginServices,
    {
      provide: REGISTER_PLUGIN_FACTORY_DIRECTIVE,
      useFactory: registerPluginFactoryDirectiveFactory,
      deps: [ PluginServices ]
    },
    {
      provide: APPEND_SCRIPT_TOKEN,
      useFactory: appendScriptFactory,
      deps: [ DOCUMENT ]
    },
    {
      provide: REMOVE_SCRIPT_TOKEN,
      useFactory: removeScriptFactory,
      deps: [ DOCUMENT ]
    },
  ]
})
export class PluginModule{}