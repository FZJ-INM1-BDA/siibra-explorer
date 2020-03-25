import { Component } from "@angular/core";
import { IPluginManifest, PluginServices } from "src/atlasViewer/pluginUnit";

@Component({
  selector : 'plugin-banner',
  templateUrl : './pluginBanner.template.html',
  styleUrls : [
    `./pluginBanner.style.css`,
  ],
})

export class PluginBannerUI {

  constructor(public pluginServices: PluginServices) {
  }

  public clickPlugin(plugin: IPluginManifest) {
    this.pluginServices.launchPlugin(plugin)
  }
}
