import { Component, TemplateRef } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { PluginService } from "../service";
import { PluginManifest } from "../types";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, scan, startWith } from "rxjs/operators";
import { select, Store } from "@ngrx/store";
import { userPreference } from "src/state";

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
    this.thirdpartyPlugin$.next({
      name: 'Added Plugin',
      iframeUrl
    })
  }
}
