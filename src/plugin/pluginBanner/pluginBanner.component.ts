import { Component, TemplateRef } from "@angular/core";
import { PluginService } from "../service";
import { PluginManifest } from "../types";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, scan, startWith } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { MatDialog } from 'src/sharedModules/angularMaterial.exports'
import { fromRootStore } from "src/state/atlasSelection";

@Component({
  selector: 'plugin-banner',
  templateUrl: './pluginBanner.template.html',
  styleUrls: [
    `./pluginBanner.style.css`,
  ],
})

export class PluginBannerUI {

  constructor(
    private store: Store,
    private svc: PluginService,
    private matDialog: MatDialog,
  ) {
  }

  public launchPlugin(plugin: PluginManifest) {
    this.svc.launchPlugin(plugin.iframeUrl)
  }

  public showTmpl(tmpl: TemplateRef<any>) {
    this.matDialog.open(tmpl, {
      minWidth: '60vw'
    })
  }

  private thirdpartyPlugin$: Subject<PluginManifest> = new Subject()

  #atp$ = this.store.pipe(
    fromRootStore.distinctATP()
  )

  #availablePlugins$: Observable<PluginManifest[]> = combineLatest([
    this.svc.pluginManifests$,
    this.thirdpartyPlugin$.pipe(
      scan((acc, curr) => acc.concat(curr), []),
      startWith([])
    ),
  ]).pipe(
    map(([builtIn, thirdParty]) => [...builtIn, ...thirdParty])
  )

  view$ = combineLatest([
    this.#atp$,
    this.#availablePlugins$,
  ]).pipe(
    map(([{ atlas, parcellation, template }, plugins]) => {
      return {
        atlas, parcellation, template, plugins
      }
    })
  )

  public addThirdPartyPlugin(iframeUrl: string) {
    this.thirdpartyPlugin$.next({
      name: 'Added Plugin',
      iframeUrl,
      'siibra-explorer': true
    })
  }

}
