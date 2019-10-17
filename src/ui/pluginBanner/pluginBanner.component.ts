import { Component } from "@angular/core";
import { PluginServices, PluginManifest } from "src/atlasViewer/atlasViewer.pluginService.service";


@Component({
  selector : 'plugin-banner',
  templateUrl : './pluginBanner.template.html',
  styleUrls : [
    `./pluginBanner.style.css`
  ]
})

export class PluginBannerUI{
  
  constructor(public pluginServices:PluginServices){
  }

  clickPlugin(plugin:PluginManifest){
    this.pluginServices.launchPlugin(plugin)
  }
}