import { Component } from "@angular/core";
import { PluginServices } from "../../atlasViewer/atlasViewer.pluginService.service";


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
}