import { Injectable, OnDestroy } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Action, createAction, createReducer, props, select, Store, on, createSelector } from "@ngrx/store";
import { combineLatest, from, Observable, of, Subscription } from "rxjs";
import { catchError, distinctUntilChanged, filter, map, mapTo, share, shareReplay, switchMap, take, withLatestFrom } from "rxjs/operators";
import { BACKENDURL, LOCAL_STORAGE_CONST } from "src/util//constants";
import { DialogService } from "../dialogService.service";
import { recursiveFindRegionWithLabelIndexId } from "src/util/fn";
import { serialiseParcellationRegion } from 'common/util'
// Get around the problem of importing duplicated string (ACTION_TYPES), even using ES6 alias seems to trip up the compiler
// TODO file bug and reverse
import { HttpClient } from "@angular/common/http";
import { actionSetMobileUi, viewerStateNewViewer, viewerStateSelectParcellation, viewerStateSetSelectedRegions } from "./viewerState/actions";
import { viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector } from "./viewerState/selectors";
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

export const actionUpdateRegionSelections = createAction(
  `[userConfig] updateRegionSelections`,
  props<{ config: { savedRegionsSelection: RegionSelection[]} }>()
)

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
  UPDATE_REGIONS_SELECTIONS: actionUpdateRegionSelections.type,
  UPDATE_REGIONS_SELECTION: 'UPDATE_REGIONS_SELECTION',
  SAVE_REGIONS_SELECTION: `SAVE_REGIONS_SELECTIONN`,
  DELETE_REGIONS_SELECTION: 'DELETE_REGIONS_SELECTION',

  LOAD_REGIONS_SELECTION: 'LOAD_REGIONS_SELECTION',
}


export const userConfigReducer = createReducer(
  defaultState,
  on(actionUpdateRegionSelections, (state, { config }) => {
    const { savedRegionsSelection } = config
    return {
      ...state,
      savedRegionsSelection
    }
  }),
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
    private dialogService: DialogService,
    private http: HttpClient,
    private constantSvc: PureContantService,
  ) {
    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1),
    )

    this.parcellationSelected$ = this.store$.pipe(
      select(viewerStateSelectedParcellationSelector),
      distinctUntilChanged(),
    )

    this.tprSelected$ = combineLatest(
      this.store$.pipe(
        select(viewerStateSelectedTemplateSelector),
        distinctUntilChanged(),
      ),
      this.parcellationSelected$,
      this.store$.pipe(
        select(viewerStateSelectedRegionsSelector)
        /**
         * TODO
         * distinct selectedRegions
         */
      ),
    ).pipe(
      map(([ templateSelected, parcellationSelected, regionsSelected ]) => {
        return {
          templateSelected, parcellationSelected, regionsSelected,
        }
      }),
    )

    this.savedRegionsSelections$ = this.store$.pipe(
      select('userConfigState'),
      select('savedRegionsSelection'),
      shareReplay(1),
    )

    this.onSaveRegionsSelection$ = this.actions$.pipe(
      ofType(ACTION_TYPES.SAVE_REGIONS_SELECTION),
      withLatestFrom(this.tprSelected$),
      withLatestFrom(this.savedRegionsSelections$),

      map(([[action, tprSelected], savedRegionsSelection]) => {
        const { payload = {} } = action as UserConfigAction
        const { name = 'Untitled' } = payload

        const { templateSelected, parcellationSelected, regionsSelected } = tprSelected
        const newSavedRegionSelection: RegionSelection = {
          id: Date.now().toString(),
          name,
          templateSelected,
          parcellationSelected,
          regionsSelected,
        }
        return {
          type: ACTION_TYPES.UPDATE_REGIONS_SELECTIONS,
          config: {
            savedRegionsSelection: savedRegionsSelection.concat([newSavedRegionSelection]),
          },
        } as UserConfigAction
      }),
    )

    this.onDeleteRegionsSelection$ = this.actions$.pipe(
      ofType(ACTION_TYPES.DELETE_REGIONS_SELECTION),
      withLatestFrom(this.savedRegionsSelections$),
      map(([ action, savedRegionsSelection ]) => {
        const { payload = {} } = action as UserConfigAction
        const { id } = payload
        return {
          type: ACTION_TYPES.UPDATE_REGIONS_SELECTIONS,
          config: {
            savedRegionsSelection: savedRegionsSelection.filter(srs => srs.id !== id),
          },
        }
      }),
    )

    this.onUpdateRegionsSelection$ = this.actions$.pipe(
      ofType(ACTION_TYPES.UPDATE_REGIONS_SELECTION),
      withLatestFrom(this.savedRegionsSelections$),
      map(([ action, savedRegionsSelection]) => {
        const { payload = {} } = action as UserConfigAction
        const { id, ...rest } = payload
        return {
          type: ACTION_TYPES.UPDATE_REGIONS_SELECTIONS,
          config: {
            savedRegionsSelection: savedRegionsSelection
              .map(srs => srs.id === id
                ? { ...srs, ...rest }
                : { ...srs }),
          },
        }
      }),
    )

    this.subscriptions.push(
      this.actions$.pipe(
        ofType(ACTION_TYPES.LOAD_REGIONS_SELECTION),
        map(action => {
          const { payload = {}} = action as UserConfigAction
          const { savedRegionsSelection }: {savedRegionsSelection: RegionSelection} = payload
          return savedRegionsSelection
        }),
        filter(val => !!val),
        withLatestFrom(this.tprSelected$),
        switchMap(([savedRegionsSelection, { parcellationSelected, templateSelected, regionsSelected }]) =>
          from(this.dialogService.getUserConfirm({
            title: `Load region selection: ${savedRegionsSelection.name}`,
            message: `This action would cause the viewer to navigate away from the current view. Proceed?`,
          })).pipe(
            catchError((e, obs) => of(null)),
            map(() => {
              return {
                savedRegionsSelection,
                parcellationSelected,
                templateSelected,
                regionsSelected,
              }
            }),
            filter(val => !!val),
          ),
        ),
        switchMap(({ savedRegionsSelection, parcellationSelected, templateSelected, regionsSelected }) => {
          if (templateSelected.name !== savedRegionsSelection.templateSelected.name ) {
            /**
             * template different, dispatch viewerStateNewViewer.type
             */
            this.store$.dispatch(
              viewerStateNewViewer({
                selectParcellation: savedRegionsSelection.parcellationSelected,
                selectTemplate: savedRegionsSelection.templateSelected,
              })
            )
            return this.parcellationSelected$.pipe(
              filter(p => p.updated),
              take(1),
              map(() => {
                return {
                  regionsSelected: savedRegionsSelection.regionsSelected,
                }
              }),
            )
          }

          if (parcellationSelected.name !== savedRegionsSelection.parcellationSelected.name) {
            /**
             * parcellation different, dispatch SELECT_PARCELLATION
             */
            this.store$.dispatch(
              viewerStateSelectParcellation({
                selectParcellation: savedRegionsSelection.parcellationSelected,
              })
            )
            return this.parcellationSelected$.pipe(
              filter(p => p.updated),
              take(1),
              map(() => {
                return {
                  regionsSelected: savedRegionsSelection.regionsSelected,
                }
              }),
            )
          }

          return of({
            regionsSelected: savedRegionsSelection.regionsSelected,
          })
        }),
      ).subscribe(({ regionsSelected }) => {
        this.store$.dispatch(
          viewerStateSetSelectedRegions({
            selectRegions: regionsSelected,
          })
        )
      }),
    )

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

    this.subscriptions.push(
      this.actions$.pipe(
        ofType(ACTION_TYPES.UPDATE_REGIONS_SELECTIONS),
      ).subscribe(action => {
        const { config = {} } = action as UserConfigAction
        const { savedRegionsSelection } = config
        const simpleSRSs = savedRegionsSelection.map(({ id, name, templateSelected, parcellationSelected, regionsSelected }) => {
          return {
            id,
            name,
            tName: templateSelected.name,
            pName: parcellationSelected.name,
            rSelected: regionsSelected.map(({ ngId, labelIndex }) => serialiseParcellationRegion({ ngId, labelIndex })),
          } as SimpleRegionSelection
        })

        /**
         * TODO save server side on per user basis
         */
        window.localStorage.setItem(LOCAL_STORAGE_CONST.SAVED_REGION_SELECTIONS, JSON.stringify(simpleSRSs))
      }),
    )

    const savedSRSsString = window.localStorage.getItem(LOCAL_STORAGE_CONST.SAVED_REGION_SELECTIONS)
    const savedSRSs: SimpleRegionSelection[] = savedSRSsString && JSON.parse(savedSRSsString)

    this.restoreSRSsFromStorage$ = viewerState$.pipe(
      filter(() => !!savedSRSs),
      select('fetchedTemplates'),
      distinctUntilChanged(),
      map(fetchedTemplates => savedSRSs.map(({ id, name, tName, pName, rSelected }) => {
        const templateSelected = fetchedTemplates.find(t => t.name === tName)
        const parcellationSelected = templateSelected && templateSelected.parcellations.find(p => p.name === pName)
        const regionsSelected = parcellationSelected && rSelected.map(labelIndexId => recursiveFindRegionWithLabelIndexId({
          regions: parcellationSelected.regions,
          labelIndexId,
          inheritedNgId: parcellationSelected.ngId
        }))
        return {
          templateSelected,
          parcellationSelected,
          id,
          name,
          regionsSelected,
        } as RegionSelection
      })),
      filter(restoredSavedRegions => restoredSavedRegions.every(rs => rs.regionsSelected && rs.regionsSelected.every(r => !!r))),
      take(1),
      map(savedRegionsSelection => {
        return {
          type: ACTION_TYPES.UPDATE_REGIONS_SELECTIONS,
          config: { savedRegionsSelection },
        }
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  /**
   * Temmplate Parcellation Regions selected
   */
  private tprSelected$: Observable<{templateSelected: any, parcellationSelected: any, regionsSelected: any[]}>
  private savedRegionsSelections$: Observable<any[]>
  private parcellationSelected$: Observable<any>

  @Effect()
  public onSaveRegionsSelection$: Observable<any>

  @Effect()
  public onDeleteRegionsSelection$: Observable<any>

  @Effect()
  public onUpdateRegionsSelection$: Observable<any>

  @Effect()
  public restoreSRSsFromStorage$: Observable<any>

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
