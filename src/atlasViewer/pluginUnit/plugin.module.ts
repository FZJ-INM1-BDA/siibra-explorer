import { NgModule } from "@angular/core";
import { PluginUnit } from "./pluginUnit.component";
import { PluginServices, registerPluginFactoryDirectiveFactory } from "./atlasViewer.pluginService.service";
import { PluginFactoryDirective, REGISTER_PLUGIN_FACTORY_DIRECTIVE } from "./pluginFactory.directive";
import { LoggingModule } from "src/logging";

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
    }
  ]
})

export class PluginModule{}