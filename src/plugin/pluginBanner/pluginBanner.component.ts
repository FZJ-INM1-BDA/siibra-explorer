import { Component } from "@angular/core";
import { PluginService } from "../service";
import { PluginManifest } from "../types";
import { combineLatest, Observable, of, Subject } from "rxjs";
import { map, scan, startWith } from "rxjs/operators";
import { select, Store } from "@ngrx/store";
import { userPreference } from "src/state";
import { UserLayerService } from "src/viewerModule/nehuba/userLayers/service";
import { enLabels } from "src/uiLabels";
import { TFileInputEvent } from "src/getFileInput/type";
import { MatSnackBar } from "src/sharedModules";

@Component({
  selector : 'plugin-banner',
  templateUrl : './pluginBanner.template.html',
  styleUrls : [
    `./pluginBanner.style.css`,
  ],
})

export class PluginBannerUI {

  #thirdpartyPlugin$: Subject<{name: 'Added Plugin', iframeUrl: string}> = new Subject()

  experimentalFlag$ = this.store.pipe(
    select(userPreference.selectors.showExperimental)
  )

  view$ = combineLatest([
    of(enLabels),
    combineLatest([
    this.svc.pluginManifests$,
      this.#thirdpartyPlugin$.pipe(
        scan((acc, curr) => acc.concat(curr), []),
        startWith([])
      ),
    ]).pipe(
      map(([builtIn, thirdParty]) => [...builtIn, ...thirdParty])
    )
  ]).pipe(
    map(([ labels, plugins ]) => {
      return {
        labels, plugins
      }
    })
  )
  

  constructor(
    private store: Store,
    private svc: PluginService,
    private userLayerSvc: UserLayerService,
    private snackbar: MatSnackBar,
  ) {
  }

  public launchPlugin(plugin: PluginManifest) {
    this.svc.launchPlugin(plugin.iframeUrl)
  }

  availablePlugins$: Observable<{
    name: string
    iframeUrl: string
  }[]> = combineLatest([
    this.svc.pluginManifests$,
    this.#thirdpartyPlugin$.pipe(
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
    this.#thirdpartyPlugin$.next({
      name: 'Added Plugin',
      iframeUrl
    })
  }

  loadUserLayer(input: TFileInputEvent<'text' | 'file' | 'url'>){
    if (input.type === "file") {
      const files = (input as TFileInputEvent<"file">).payload.files
      if (files.length !== 1) {
        this.snackbar.open(`Can only handle one and only one file. You supplied ${files.length} files.`, "Dismiss")
        return
      }
      this.userLayerSvc.handleUserInput(files[0])
      return
    }
    if (input.type === "url") {
      let url = (input as TFileInputEvent<"url">).payload.url
      if (!url.startsWith("x-overlay-layer")) {
        url = `x-overlay-layer://${url}`
      }
      this.userLayerSvc.handleUserInput(url)
      return
    }
    this.snackbar.open(`Cannot handle input`, "Dismiss")
  }
}
