import { Injectable, OnDestroy } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Action, createAction, createReducer, props, select, Store, on, createSelector } from "@ngrx/store";
import { of, Subscription } from "rxjs";
import { catchError, filter, map } from "rxjs/operators";
import { LOCAL_STORAGE_CONST } from "src/util//constants";
// Get around the problem of importing duplicated string (ACTION_TYPES), even using ES6 alias seems to trip up the compiler
// TODO file bug and reverse
import { HttpClient } from "@angular/common/http";
import { actionSetMobileUi } from "./viewerState/actions";
import { PureContantService } from "src/util";

interface ICsp{
  'connect-src'?: string[]
  'script-src'?: string[]
}

export interface StateInterface {
  savedRegionsSelection: RegionSelection[]
  /**
   * plugin csp - currently store in localStorage
   * if user log in, store in user profile
   */
  pluginCsp: {
    /**
     * key === plugin version id 
     */
    [key: string]: ICsp
  }
}

export interface RegionSelection {
  templateSelected: any
  parcellationSelected: any
  regionsSelected: any[]
  name: string
  id: string
}

/**
 * for serialisation into local storage/database
 */
interface SimpleRegionSelection {
  id: string
  name: string
  tName: string
  pName: string
  rSelected: string[]
}

interface UserConfigAction extends Action {
  config?: Partial<StateInterface>
  payload?: any
}

export const defaultState: StateInterface = {
  savedRegionsSelection: [],
  pluginCsp: {}
}

export const selectorAllPluginsCspPermission = createSelector(
  (state: any) => state.userConfigState,
  userConfigState => userConfigState.pluginCsp
)

export const actionUpdatePluginCsp = createAction(
  `[userConfig] updatePluginCspPermission`,
  props<{
    payload: {
      [key: string]: ICsp
    }
  }>()
)

export const ACTION_TYPES = {
  UPDATE_REGIONS_SELECTION: 'UPDATE_REGIONS_SELECTION',
}


export const userConfigReducer = createReducer(
  defaultState,
  on(actionUpdatePluginCsp, (state, { payload }) => {
    return {
      ...state,
      pluginCsp: payload
    }
  })
)

@Injectable({
  providedIn: 'root',
})
export class UserConfigStateUseEffect implements OnDestroy {

  private subscriptions: Subscription[] = []

  constructor(
    private actions$: Actions,
    private store$: Store<any>,
    private http: HttpClient,
    private constantSvc: PureContantService,
  ) {

    this.subscriptions.push(
      this.store$.pipe(
        select('viewerConfigState'),
      ).subscribe(({ gpuLimit, animation }) => {

        if (gpuLimit) {
          window.localStorage.setItem(LOCAL_STORAGE_CONST.GPU_LIMIT, gpuLimit.toString())
        }
        if (typeof animation !== 'undefined' && animation !== null) {
          window.localStorage.setItem(LOCAL_STORAGE_CONST.ANIMATION, animation.toString())
        }
      }),
    )

    this.subscriptions.push(
      this.actions$.pipe(
        ofType(actionSetMobileUi.type),
        map((action: any) => {
          const { payload } = action
          const { useMobileUI } = payload
          return useMobileUI
        }),
        filter(bool => bool !== null),
      ).subscribe((bool: boolean) => {
        window.localStorage.setItem(LOCAL_STORAGE_CONST.MOBILE_UI, JSON.stringify(bool))
      }),
    )

  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }


  @Effect()
  public setInitPluginPermission$ = this.http.get(`${this.constantSvc.backendUrl}user/pluginPermissions`, {
    responseType: 'json'
  }).pipe(
    /**
     * TODO show warning?
     */
    catchError(() => of({})),
    map((json: any) => actionUpdatePluginCsp({ payload: json }))
  )
}
