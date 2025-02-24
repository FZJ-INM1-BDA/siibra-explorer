import { Component, TemplateRef } from "@angular/core";
import { PluginService } from "../service";
import { PluginManifest } from "../types";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, scan, startWith } from "rxjs/operators";
import { select, Store } from "@ngrx/store";
import { userPreference } from "src/state";
import { MatDialog } from 'src/sharedModules/angularMaterial.exports'
import { UserLayerService } from "src/viewerModule/nehuba/userLayers/service";

@Component({
  selector : 'plugin-banner',
  templateUrl : './pluginBanner.template.html',
  styleUrls : [
    `./pluginBanner.style.css`,
  ],
})

export class PluginBannerUI {

  experimentalFlag$ = this.store.pipe(
    select(userPreference.selectors.showExperimental)
  )
  

  constructor(
    private store: Store,
    private svc: PluginService,
    private matDialog: MatDialog,
    private userLayerSvc: UserLayerService,
  ) {
  }

  public launchPlugin(plugin: PluginManifest) {
    this.svc.launchPlugin(plugin.iframeUrl)
  }

  public showTmpl(tmpl: TemplateRef<any>){
    this.matDialog.open(tmpl, {
      minWidth: '60vw'
    })
  }

  private thirdpartyPlugin$: Subject<{name: 'Added Plugin', iframeUrl: string}> = new Subject()

  availablePlugins$: Observable<{
    name: string
    iframeUrl: string
  }[]> = combineLatest([
    this.svc.pluginManifests$,
    this.thirdpartyPlugin$.pipe(
      scan((acc, curr) => acc.concat(curr), []),
      startWith([])
    ),
  ]).pipe(
    map(([builtIn, thirdParty]) => [...builtIn, ...thirdParty])
  )

  public addThirdPartyPlugin(iframeUrl: string) {
    try {
      UserLayerService.VerifyUrl(iframeUrl)
      this.userLayerSvc.handleUserInput(iframeUrl)
      return
      /* eslint-disable-next-line no-empty */
    } catch (e) {

    }
    this.thirdpartyPlugin$.next({
      name: 'Added Plugin',
      iframeUrl
    })
  }
}
