import { Action, Store, select } from "@ngrx/store";
import { Injectable, OnDestroy } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Observable, combineLatest, Subscription, from, of } from "rxjs";
import { shareReplay, withLatestFrom, map, distinctUntilChanged, filter, take, switchMap, catchError, share } from "rxjs/operators";
import { generateLabelIndexId, recursiveFindRegionWithLabelIndexId, IavRootStoreInterface } from "../stateStore.service";
import { SELECT_REGIONS, NEWVIEWER, SELECT_PARCELLATION } from "./viewerState.store";
import { DialogService } from "../dialogService.service";
import { ACTION_TYPES as VIEWER_CONFIG_ACTION_TYPES } from "./viewerConfig.store";
import { LOCAL_STORAGE_CONST } from "src/util//constants";

export interface StateInterface{
  savedRegionsSelection: RegionSelection[]
}

export interface RegionSelection{
  templateSelected: any
  parcellationSelected: any
  regionsSelected: any[]
  name: string
  id: string
}

/**
 * for serialisation into local storage/database
 */
interface SimpleRegionSelection{
  id: string,
  name: string,
  tName: string,
  pName: string,
  rSelected: string[]
}

interface UserConfigAction extends Action{
  config?: Partial<StateInterface>
  payload?: any
}

const defaultUserConfigState: StateInterface = {
  savedRegionsSelection: []
}

export const ACTION_TYPES = {
  UPDATE_REGIONS_SELECTIONS: `UPDATE_REGIONS_SELECTIONS`,
  UPDATE_REGIONS_SELECTION:'UPDATE_REGIONS_SELECTION',
  SAVE_REGIONS_SELECTION: `SAVE_REGIONS_SELECTIONN`,
  DELETE_REGIONS_SELECTION: 'DELETE_REGIONS_SELECTION',

  LOAD_REGIONS_SELECTION: 'LOAD_REGIONS_SELECTION'
}


export function stateStore(prevState: StateInterface = defaultUserConfigState, action: UserConfigAction) {
  switch(action.type) {
    case ACTION_TYPES.UPDATE_REGIONS_SELECTIONS:
      const { config = {} } = action
      const { savedRegionsSelection } = config
      return {
        ...prevState,
        savedRegionsSelection
      }
    default:
      return {
        ...prevState
      }
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserConfigStateUseEffect implements OnDestroy{

  private subscriptions: Subscription[] = []

  constructor(
    private actions$: Actions,
    private store$: Store<IavRootStoreInterface>,
    private dialogService: DialogService
  ){
    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1)
    )

    this.parcellationSelected$ = viewerState$.pipe(
      select('parcellationSelected'),
      distinctUntilChanged(),
      share()
    )

    this.tprSelected$ = combineLatest(
      viewerState$.pipe(
        select('templateSelected'),
        distinctUntilChanged()
      ),
      this.parcellationSelected$,
      viewerState$.pipe(
        select('regionsSelected'),
        /**
         * TODO
         * distinct selectedRegions
         */
      )
    ).pipe(
      map(([ templateSelected, parcellationSelected, regionsSelected ]) => {
        return {
          templateSelected, parcellationSelected, regionsSelected
        }
      }),
      shareReplay(1)
    )

    this.savedRegionsSelections$ = this.store$.pipe(
      select('userConfigState'),
      select('savedRegionsSelection'),
      shareReplay(1)
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
          regionsSelected
        }
        return {
          type: ACTION_TYPES.UPDATE_REGIONS_SELECTIONS,
          config: {
            savedRegionsSelection: savedRegionsSelection.concat([newSavedRegionSelection])
          }
        } as UserConfigAction
      })
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
            savedRegionsSelection: savedRegionsSelection.filter(srs => srs.id !== id)
          }
        }
      })
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
                : { ...srs })
          }
        }
      })
    )

    this.subscriptions.push(
      this.actions$.pipe(
        ofType(ACTION_TYPES.LOAD_REGIONS_SELECTION),
        map(action => {
          const { payload = {}} = action as UserConfigAction
          const { savedRegionsSelection } : {savedRegionsSelection : RegionSelection} = payload
          return savedRegionsSelection
        }),
        filter(val => !!val),
        withLatestFrom(this.tprSelected$),
        switchMap(([savedRegionsSelection, { parcellationSelected, templateSelected, regionsSelected }]) => 
          from(this.dialogService.getUserConfirm({
            title: `Load region selection: ${savedRegionsSelection.name}`,
            message: `This action would cause the viewer to navigate away from the current view. Proceed?`
          })).pipe(
            catchError((e, obs) => of(null)),
            map(() => {
              return {
                savedRegionsSelection,
                parcellationSelected,
                templateSelected,
                regionsSelected
              }
            }),
            filter(val => !!val)
          )
        ),
        switchMap(({ savedRegionsSelection, parcellationSelected, templateSelected, regionsSelected }) => {
          if (templateSelected.name !== savedRegionsSelection.templateSelected.name ) {
            /**
             * template different, dispatch NEWVIEWER
             */
            this.store$.dispatch({
              type: NEWVIEWER,
              selectParcellation: savedRegionsSelection.parcellationSelected,
              selectTemplate: savedRegionsSelection.templateSelected
            })
            return this.parcellationSelected$.pipe(
              filter(p => p.updated),
              take(1),
              map(() => {
                return {
                  regionsSelected: savedRegionsSelection.regionsSelected
                }
              })
            )
          }
  
          if (parcellationSelected.name !== savedRegionsSelection.parcellationSelected.name) {
            /**
             * parcellation different, dispatch SELECT_PARCELLATION
             */
  
             this.store$.dispatch({
               type: SELECT_PARCELLATION,
               selectParcellation: savedRegionsSelection.parcellationSelected
             })
            return this.parcellationSelected$.pipe(
              filter(p => p.updated),
              take(1),
              map(() => {
                return {
                  regionsSelected: savedRegionsSelection.regionsSelected
                }
              })
            )
          }

          return of({ 
            regionsSelected: savedRegionsSelection.regionsSelected
          })
        })
      ).subscribe(({ regionsSelected }) => {
        this.store$.dispatch({
          type: SELECT_REGIONS,
          selectRegions: regionsSelected
        })
      })
    )

    this.subscriptions.push(
      this.store$.pipe(
        select('viewerConfigState')
      ).subscribe(({ gpuLimit, animation }) => {

        if (gpuLimit) {
          window.localStorage.setItem(LOCAL_STORAGE_CONST.GPU_LIMIT, gpuLimit.toString())
        }
        if (typeof animation !== 'undefined' && animation !== null) {
          window.localStorage.setItem(LOCAL_STORAGE_CONST.ANIMATION, animation.toString())
        }
      })
    )

    this.subscriptions.push(
      this.actions$.pipe(

        ofType(VIEWER_CONFIG_ACTION_TYPES.SET_MOBILE_UI),
        map((action: any) => {
          const { payload } = action
          const { useMobileUI } = payload
          return useMobileUI
        }),
        filter(bool => bool !== null)
      ).subscribe((bool: boolean) => {
        window.localStorage.setItem(LOCAL_STORAGE_CONST.MOBILE_UI, JSON.stringify(bool))
      })
    )

    this.subscriptions.push(
      this.actions$.pipe(
        ofType(ACTION_TYPES.UPDATE_REGIONS_SELECTIONS)
      ).subscribe(action => {
        const { config = {} } = action as UserConfigAction
        const { savedRegionsSelection } = config
        const simpleSRSs = savedRegionsSelection.map(({ id, name, templateSelected, parcellationSelected, regionsSelected }) => {
          return {
            id,
            name,
            tName: templateSelected.name,
            pName: parcellationSelected.name,
            rSelected: regionsSelected.map(({ ngId, labelIndex }) => generateLabelIndexId({ ngId, labelIndex }))
          } as SimpleRegionSelection
        })

        /**
         * TODO save server side on per user basis
         */
        window.localStorage.setItem(LOCAL_STORAGE_CONST.SAVED_REGION_SELECTIONS, JSON.stringify(simpleSRSs))
      })
    )

    const savedSRSsString = window.localStorage.getItem(LOCAL_STORAGE_CONST.SAVED_REGION_SELECTIONS)
    const savedSRSs:SimpleRegionSelection[] = savedSRSsString && JSON.parse(savedSRSsString)

    this.restoreSRSsFromStorage$ = viewerState$.pipe(
      filter(() => !!savedSRSs),
      select('fetchedTemplates'),
      distinctUntilChanged(),
      map(fetchedTemplates => savedSRSs.map(({ id, name, tName, pName, rSelected }) => {
        const templateSelected = fetchedTemplates.find(t => t.name === tName)
        const parcellationSelected = templateSelected && templateSelected.parcellations.find(p => p.name === pName)
        const regionsSelected = parcellationSelected && rSelected.map(labelIndexId => recursiveFindRegionWithLabelIndexId({ regions: parcellationSelected.regions, labelIndexId, inheritedNgId: parcellationSelected.ngId }))
        return {
          templateSelected,
          parcellationSelected,
          id,
          name,
          regionsSelected
        } as RegionSelection
      })),
      filter(RSs => RSs.every(rs => rs.regionsSelected && rs.regionsSelected.every(r => !!r))),
      take(1),
      map(savedRegionsSelection => {
        return {
          type: ACTION_TYPES.UPDATE_REGIONS_SELECTIONS,
          config: { savedRegionsSelection }
        }
      })
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  /**
   * Temmplate Parcellation Regions selected
   */
  private tprSelected$: Observable<{templateSelected:any, parcellationSelected: any, regionsSelected: any[]}>
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
}
