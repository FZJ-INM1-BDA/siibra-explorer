import { Injectable } from "@angular/core"
import { Effect } from "@ngrx/effects"
import { select, Store } from "@ngrx/store"
import { Observable, forkJoin } from "rxjs"
import { filter, map, startWith, switchMap } from "rxjs/operators"
import { PluginServices } from "src/plugin/atlasViewer.pluginService.service"
import { PLUGINSTORE_CONSTANTS, PLUGINSTORE_ACTION_TYPES, pluginStateSelectorInitManifests } from 'src/services/state/pluginState.helper'
import { HttpClient } from "@angular/common/http"
import { getHttpHeader } from "src/util/constants"

@Injectable({
  providedIn: 'root',
})

export class PluginServiceUseEffect {

  @Effect()
  public initManifests$: Observable<any>

  constructor(
    store$: Store<any>,
    pluginService: PluginServices,
    http: HttpClient
  ) {
    this.initManifests$ = store$.pipe(
      select(pluginStateSelectorInitManifests),
      startWith([]),
      map(arr => {
        // only launch plugins that has init manifest src label on it
        return arr.filter(([ source ]) => source === PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC)
      }),
      filter(arr => arr.length > 0),
      switchMap(arr => forkJoin(
        arr.map(([_source, url]) => 
          http.get(url, {
            headers: getHttpHeader(),
            responseType: 'json'
          })
        )
      )),
      map((jsons: any[]) => {
        for (const json of jsons){
          pluginService.launchNewWidget(json)
        }

        // clear init manifest
        return {
          type: PLUGINSTORE_ACTION_TYPES.CLEAR_INIT_PLUGIN,
        }
      }),
    )
  }
}
