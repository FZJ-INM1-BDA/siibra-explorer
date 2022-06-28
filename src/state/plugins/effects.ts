import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { catchError, filter, map, mapTo, switchMap } from "rxjs/operators";
import * as constants from "./const"
import * as selectors from "./selectors"
import * as actions from "./actions"
import { DialogService } from "src/services/dialogService.service";
import { NEVER, of } from "rxjs";
import { PluginService } from "src/plugin/service";

@Injectable()
export class Effects{

  initMan = this.store.pipe(
    select(selectors.initManfests),
    map(initMan => initMan[constants.INIT_MANIFEST_SRC]),
    filter(val => val && val.length > 0),
  )

  private pendingList = new Set<string>()
  private launchedList = new Set<string>()
  private banList = new Set<string>()

  initManLaunch = createEffect(() => this.initMan.pipe(
    switchMap(val => of(...val)),
    switchMap(
      url => {
        if (this.pendingList.has(url)) return NEVER
        if (this.launchedList.has(url)) return NEVER
        if (this.banList.has(url)) return NEVER
        this.pendingList.add(url)
        return this.dialogSvc
          .getUserConfirm({
            message: `This URL is trying to open a plugin from ${url}. Proceed?`
          })
          .then(() => {
            this.launchedList.add(url)
            return this.svc.launchPlugin(url)
          })
          .finally(() => {
            this.pendingList.delete(url)
          })
      }
    ),
    catchError(() => of(null))
  ), { dispatch: false })

  initManClear = createEffect(() => this.initMan.pipe(
    mapTo(
      actions.clearInitManifests({
        nameSpace: constants.INIT_MANIFEST_SRC
      })
    )
  ))

  constructor(
    private store: Store,
    private dialogSvc: DialogService,
    private svc: PluginService,
  ){
    
  }
}
