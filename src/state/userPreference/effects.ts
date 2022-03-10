import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { map } from "rxjs/operators";
import { COOKIE_VERSION, KG_TOS_VERSION, LOCAL_STORAGE_CONST } from "src/util/constants";
import * as actions from "./actions"

@Injectable()
export class Effects{

  onUseMobileUi = createEffect(() => this.actions$.pipe(
    ofType(actions.useMobileUi),
    map(({ flag }) => {
      window.localStorage.setItem(LOCAL_STORAGE_CONST.MOBILE_UI, JSON.stringify(flag))
    })
  ), { dispatch: false })
  
  onSetGpuLimit = createEffect(() => this.actions$.pipe(
    ofType(actions.setGpuLimit),
    map(({ limit }) => {
      localStorage.setItem(LOCAL_STORAGE_CONST.GPU_LIMIT, limit.toString())
    })
  ), { dispatch: false })

  onAgreeCookie = createEffect(() => this.actions$.pipe(
    ofType(actions.agreeCookie),
    map(() => {
      localStorage.setItem(LOCAL_STORAGE_CONST.AGREE_COOKIE, COOKIE_VERSION)
    })
  ), { dispatch: false })

  onAgreeKgTos = createEffect(() => this.actions$.pipe(
    ofType(actions.agreeKgTos),
    map(() => {
      localStorage.setItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS, KG_TOS_VERSION)
    })
  ), { dispatch: false })

  // TODO setup on startup get user csp
  // this.http.get(`${this.constantSvc.backendUrl}user/pluginPermissions`)
  // onStartUpGetCsp

  constructor(
    private actions$: Actions,
    private http: HttpClient,
  ){
  }
}
