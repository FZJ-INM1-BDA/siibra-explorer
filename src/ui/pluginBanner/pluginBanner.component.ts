import { Component, ViewChild, TemplateRef } from "@angular/core";
import { IPluginManifest, PluginServices } from "src/atlasViewer/pluginUnit";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector : 'plugin-banner',
  templateUrl : './pluginBanner.template.html',
  styleUrls : [
    `./pluginBanner.style.css`,
  ],
})

export class PluginBannerUI {

  @ViewChild('pluginInfoTmpl', { read: TemplateRef })
  private pluginInfoTmpl: TemplateRef<any>

  constructor(
    public pluginServices: PluginServices,
    private matDialog: MatDialog,
  ) {
  }

  public clickPlugin(plugin: IPluginManifest) {
    this.pluginServices.launchPlugin(plugin)
  }

  public showPluginInfo(manifest: IPluginManifest){
    this.matDialog.open(
      this.pluginInfoTmpl,
      {
        data: manifest,
        ariaLabel: `Additional information about a plugin`
      }
    )
  }
}
