import { Injectable } from "@angular/core"
import { Effect } from "@ngrx/effects"
import { select, Store } from "@ngrx/store"
import { Observable } from "rxjs"
import { filter, map, startWith } from "rxjs/operators"
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service"
import { PluginServices } from "src/atlasViewer/atlasViewer.pluginService.service"
import { ACTION_TYPES as PLUGINSTORE_ACTION_TYPES, CONSTANTS as PLUGINSTORE_CONSTANTS } from 'src/services/state/pluginState.store'
import { LoggingService } from "../logging.service"
import { IavRootStoreInterface } from "../stateStore.service"

@Injectable({
  providedIn: 'root',
})

export class PluginServiceUseEffect {

  @Effect()
  public initManifests$: Observable<any>

  constructor(
    store$: Store<IavRootStoreInterface>,
    constantService: AtlasViewerConstantsServices,
    pluginService: PluginServices,
    private log: LoggingService,
  ) {
    this.initManifests$ = store$.pipe(
      select('pluginState'),
      select('initManifests'),
      filter(v => !!v),
      startWith([]),
      map(arr => {
        // only launch plugins that has init manifest src label on it
        return arr.filter(([ source ]) => source === PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC)
      }),
      filter(arr => arr.length > 0),
      map((arr: Array<[string, string|null]>) => {

        for (const [_source, url] of arr) {
          fetch(url, constantService.getFetchOption())
            .then(res => res.json())
            .then(json => pluginService.launchNewWidget(json))
            .catch(e => this.log.error(e))
        }

        // clear init manifest
        return {
          type: PLUGINSTORE_ACTION_TYPES.CLEAR_INIT_PLUGIN,
        }
      }),
    )
  }
}
