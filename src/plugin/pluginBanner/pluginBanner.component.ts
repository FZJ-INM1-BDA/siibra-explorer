import { Component, ViewChild, TemplateRef } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { environment } from 'src/environments/environment';
import { MatSnackBar } from "@angular/material/snack-bar";
import { PluginService } from "../service";
import { PluginManifest } from "../types";

@Component({
  selector : 'plugin-banner',
  templateUrl : './pluginBanner.template.html',
  styleUrls : [
    `./pluginBanner.style.css`,
  ],
})

export class PluginBannerUI {

  EXPERIMENTAL_FEATURE_FLAG = environment.EXPERIMENTAL_FEATURE_FLAG

  pluginManifests: PluginManifest[] = []

  constructor(
    private svc: PluginService,
    private matDialog: MatDialog,
    private matSnackbar: MatSnackBar,
  ) {
  }

  public launchPlugin(plugin: PluginManifest) {
    this.svc.launchPlugin(plugin.url)
  }

  public showTmpl(tmpl: TemplateRef<any>){
    this.matDialog.open(tmpl, {
      minWidth: '60vw'
    })
  }

  public loadingThirdpartyPlugin = false
  public async addThirdPartyPlugin(manifestUrl: string) {
    this.matSnackbar.open(`Adding third party plugin is current unavailable.`)
  }

  test(){
    this.svc.launchPlugin('http://localhost:8000')
  }
}
