import { NgModule } from "@angular/core";
import { PluginUnit } from "./pluginUnit.component";
import { PluginServices } from "./atlasViewer.pluginService.service";
import { PluginFactoryDirective } from "./pluginFactory.directive";
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
    PluginServices
  ]
})

export class PluginModule{}