import { NgModule } from "@angular/core";
import { PluginUnit } from "./pluginUnit.component";
import { PluginServices, registerPluginFactoryDirectiveFactory } from "./atlasViewer.pluginService.service";
import { PluginFactoryDirective, REGISTER_PLUGIN_FACTORY_DIRECTIVE } from "./pluginFactory.directive";
import { LoggingModule } from "src/logging";
import { APPEND_SCRIPT_TOKEN, appendScriptFactory, REMOVE_SCRIPT_TOKEN, removeScriptFactory } from "src/util/constants";
import { DOCUMENT } from "@angular/common";

@NgModule({
  imports:[
    LoggingModule,
  ],
  declarations: [
    PluginUnit,
    PluginFactoryDirective
  ],
  entryComponents: [
    PluginUnit
  ],
  exports: [
    PluginUnit,
    PluginFactoryDirective
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