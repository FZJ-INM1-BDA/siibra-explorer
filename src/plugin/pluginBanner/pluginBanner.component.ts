import { Component, ViewChild, TemplateRef } from "@angular/core";
import { IPluginManifest, PluginServices } from "../atlasViewer.pluginService.service";
import { MatDialog } from "@angular/material/dialog";
import { environment } from 'src/environments/environment';
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector : 'plugin-banner',
  templateUrl : './pluginBanner.template.html',
  styleUrls : [
    `./pluginBanner.style.css`,
  ],
})

export class PluginBannerUI {

  EXPERIMENTAL_FEATURE_FLAG = environment.EXPERIMENTAL_FEATURE_FLAG

  @ViewChild('pluginInfoTmpl', { read: TemplateRef })
  private pluginInfoTmpl: TemplateRef<any>

  constructor(
    public pluginServices: PluginServices,
    private matDialog: MatDialog,
    private matSnackbar: MatSnackBar,
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

  public showTmpl(tmpl: TemplateRef<any>){
    this.matDialog.open(tmpl, {
      minWidth: '60vw'
    })
  }

  public loadingThirdpartyPlugin = false

  public async addThirdPartyPlugin(manifestUrl: string) {
    this.loadingThirdpartyPlugin = true
    try {
      await this.pluginServices.addPluginViaManifestUrl(manifestUrl)
      this.loadingThirdpartyPlugin = false
      this.matSnackbar.open(`Adding plugin successful`)
    } catch (e) {
      this.loadingThirdpartyPlugin = false
      this.matSnackbar.open(`Error adding plugin: ${e.toString()}`)
    }
  }
}
