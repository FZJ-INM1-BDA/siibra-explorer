import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { catchError, filter, map, mapTo, switchMap } from "rxjs/operators";
import * as constants from "./const"
import * as selectors from "./selectors"
import * as actions from "./actions"
import { DialogService } from "src/services/dialogService.service";
import { of } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { getHttpHeader } from "src/util/constants"

@Injectable()
export class Effects{

  initMan = this.store.pipe(
    select(selectors.initManfests),
    map(initMan => initMan[constants.INIT_MANIFEST_SRC]),
    filter(val => !!val),
  )

  initManLaunch = createEffect(() => this.initMan.pipe(
    switchMap(val => 
      this.dialogSvc
        .getUserConfirm({
          message: `This URL is trying to open a plugin from ${val}. Proceed?`
        })
        .then(() => 
          this.http.get(val, {
            headers: getHttpHeader(),
            responseType: 'json'
          }).toPromise()
        )
        .then(json => {
          /**
           * TODO fix init plugin launch
           * at that time, also restore effects.spec.ts test
           */
        })
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
    private http: HttpClient,
  ){
    
  }
}