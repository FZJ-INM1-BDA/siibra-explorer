import { Component } from "@angular/core";
import { PluginServices, PluginManifest } from "../../atlasViewer/atlasViewer.pluginService.service";


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
    if(this.pluginEnabledFlag)
      this.pluginServices.launchPlugin(plugin)
    else
      return
  }

  get pluginEnabledFlag(){
    return PLUGINDEV || BUNDLEDPLUGINS.length > 0
      ? true
      : false
  }
}