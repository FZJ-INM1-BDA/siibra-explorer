import { Injectable, OnDestroy } from '@angular/core';
import { Observable, combineLatest, fromEvent, Subscription, of } from 'rxjs';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { withLatestFrom, map, distinctUntilChanged, scan, shareReplay, filter, mapTo, debounceTime, catchError, skip, throttleTime } from 'rxjs/operators';
import { getNgIds } from 'src/util/fn';
import { Action, select, Store, createReducer, on } from '@ngrx/store'
import { CYCLE_PANEL_MESSAGE } from 'src/util/constants';
import { HttpClient } from '@angular/common/http';
import { INgLayerInterface, ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer, ngViewerActionSetPerspOctantRemoval } from './ngViewerState.store.helper'
import { PureContantService } from 'src/util';
import { PANELS } from './ngViewerState.store.helper'
import { ngViewerActionToggleMax, ngViewerActionClearView, ngViewerActionSetPanelOrder, ngViewerActionSwitchPanelMode, ngViewerActionForceShowSegment, ngViewerActionNehubaReady, ngViewerActionCycleViews } from './ngViewerState/actions';
import { generalApplyState } from '../stateStore.helper';
import { ngViewerSelectorPanelMode, ngViewerSelectorPanelOrder } from './ngViewerState/selectors';
import { uiActionSnackbarMessage } from './uiState/actions';
import { TUserRouteError } from 'src/auth/auth.service';
import { viewerStateSelectedTemplateSelector } from './viewerState.store.helper';

export function mixNgLayers(oldLayers: INgLayerInterface[], newLayers: INgLayerInterface|INgLayerInterface[]): INgLayerInterface[] {
  if (newLayers instanceof Array) {
    return oldLayers.concat(newLayers)
  } else {
    return oldLayers.concat({
      ...newLayers,
    })
  }
}

export interface StateInterface {
  layers: INgLayerInterface[]
  forceShowSegment: boolean | null
  nehubaReady: boolean
  panelMode: string
  panelOrder: string

  octantRemoval: boolean
  showSubstrate: boolean
  showZoomlevel: boolean

  clearViewQueue: {
    [key: string]: boolean
  }
}

export interface ActionInterface extends Action {
  layer: INgLayerInterface
  layers: INgLayerInterface[]
  forceShowSegment: boolean
  nehubaReady: boolean
  payload: any
}

export const defaultState: StateInterface = {
  layers: [],
  forceShowSegment: null,
  nehubaReady: false,
  panelMode: PANELS.FOUR_PANEL,
  panelOrder: `0123`,

  octantRemoval: true,
  showSubstrate: null,
  showZoomlevel: null,

  clearViewQueue: {}
}

export const ngViewerStateReducer = createReducer(
  defaultState,
  on(ngViewerActionClearView, (state, { payload }) => {
    const { clearViewQueue } = state
    const clearViewQueueUpdated = {...clearViewQueue}
    for (const key in payload) {
      clearViewQueueUpdated[key] = payload[key]
    }
    return {
      ...state,
      clearViewQueue: clearViewQueueUpdated
    }
  }),
  on(ngViewerActionSetPerspOctantRemoval, (state, { octantRemovalFlag }) => {
    return {
      ...state,
      octantRemoval: octantRemovalFlag
    }
  }),
  on(ngViewerActionAddNgLayer, (state, { layer }) => {
    return {
      ...state,
      layers: mixNgLayers(state.layers, layer)
    }
  }),
  on(ngViewerActionSetPanelOrder, (state, { payload }) => {
    const { panelOrder } = payload
    return {
      ...state,
      panelOrder
    }
  }),
  on(ngViewerActionSwitchPanelMode, (state, { payload }) => {
    const { panelMode } = payload
    if (SUPPORTED_PANEL_MODES.indexOf(panelMode as any) < 0) { return state }
    return {
      ...state,
      panelMode
    }
  }),
  on(ngViewerActionRemoveNgLayer, (state, { layer }) => {
    
    const newLayers = Array.isArray(layer)
      ? (() => {
        const layerNameSet = new Set(layer.map(l => l.name))
        return state.layers.filter(l => !layerNameSet.has(l.name))
      })()
      : state.layers.filter(l => l.name !== layer.name)
    return {
      ...state,
      layers: newLayers
    }
  }),
  on(ngViewerActionForceShowSegment, (state, { forceShowSegment }) => {
    return {
      ...state,
      forceShowSegment
    }
  }),
  on(ngViewerActionNehubaReady, (state, { nehubaReady }) => {
    return {
      ...state,
      nehubaReady
    }
  }),
  on(generalApplyState, (_, { state }) => {
    const { ngViewerState } = state
    return ngViewerState
  })
)


// must export a named function for aot compilation
// see https://github.com/angular/angular/issues/15587
// https://github.com/amcdnl/ngrx-actions/issues/23
// or just google for:
//
// angular function expressions are not supported in decorators

export function stateStore(state, action) {
  return ngViewerStateReducer(state, action)
}

type TUserConfig = {

}

type TUserConfigResp = TUserConfig & TUserRouteError

@Injectable({
  providedIn: 'root',
})

export class NgViewerUseEffect implements OnDestroy {
  @Effect()
  public toggleMaximiseMode$: Observable<any>

  @Effect()
  public unmaximiseOrder$: Observable<any>

  @Effect()
  public maximiseOrder$: Observable<any>

  @Effect()
  public toggleMaximiseCycleMessage$: Observable<any>

  @Effect()
  public cycleViews$: Observable<any>

  @Effect()
  public removeAllNonBaseLayers$: Observable<any>

  private panelOrder$: Observable<string>
  private panelMode$: Observable<string>

  private subscriptions: Subscription[] = []

  @Effect()
  public applySavedUserConfig$: Observable<any>

  constructor(
    private actions: Actions,
    private store$: Store<any>,
    private pureConstantService: PureContantService,
    private http: HttpClient,
  ){

    // TODO either split backend user to be more granular, or combine the user config into a single subscription
    this.subscriptions.push(
      this.store$.pipe(
        select('ngViewerState'),
        debounceTime(200),
        skip(1),
        // Max frequency save once every second

        // properties to be saved
        map(({ panelMode, panelOrder }) => {
          return { panelMode, panelOrder }
        }),
        distinctUntilChanged(),
        throttleTime(1000)
      ).subscribe(ngViewerState => {
        this.http.post(`${this.pureConstantService.backendUrl}user/config`, JSON.stringify({ ngViewerState }),  {
          headers: {
            'Content-type': 'application/json'
          }
        })
      })
    )

    this.applySavedUserConfig$ = this.http.get<TUserConfigResp>(`${this.pureConstantService.backendUrl}user/config`).pipe(
      map(json => {
        if (json.error) {
          throw new Error(json.message || 'User not loggedin.')
        }
        return json
      }),
      catchError((err,caught) => of(null)),
      filter(v => !!v),
      withLatestFrom(this.store$),
      map(([{ ngViewerState: fetchedNgViewerState }, state]) => {
        const { ngViewerState } = state
        return generalApplyState({
          state: {
            ...state,
            ngViewerState: {
              ...ngViewerState,
              ...fetchedNgViewerState
            }}
        })
      })
    )

    const toggleMaxmimise$ = this.actions.pipe(
      ofType(ngViewerActionToggleMax.type),
      shareReplay(1),
    )

    this.panelOrder$ = this.store$.pipe(
      select(ngViewerSelectorPanelOrder),
      distinctUntilChanged(),
    )

    this.panelMode$ = this.store$.pipe(
      select(ngViewerSelectorPanelMode),
      distinctUntilChanged(),
    )

    this.cycleViews$ = this.actions.pipe(
      ofType(ngViewerActionCycleViews.type),
      withLatestFrom(this.panelOrder$),
      map(([_, panelOrder]) => {
        return ngViewerActionSetPanelOrder({
          payload: {
            panelOrder: [...panelOrder.slice(1), ...panelOrder.slice(0, 1)].join(''),
          }
        })
      }),
    )

    this.maximiseOrder$ = toggleMaxmimise$.pipe(
      withLatestFrom(
        combineLatest([
          this.panelOrder$,
          this.panelMode$,
        ]),
      ),
      filter(([_action, [_panelOrder, panelMode]]) => panelMode !== PANELS.SINGLE_PANEL),
      map(([ action, [ oldPanelOrder ] ]) => {
        const { payload } = action as ActionInterface
        const { index = 0 } = payload

        const panelOrder = [...oldPanelOrder.slice(index), ...oldPanelOrder.slice(0, index)].join('')
        return ngViewerActionSetPanelOrder({
          payload: { panelOrder },
        })
      }),
    )

    this.unmaximiseOrder$ = toggleMaxmimise$.pipe(
      withLatestFrom(
        combineLatest([
          this.panelOrder$,
          this.panelMode$,
        ]),
      ),
      scan((acc, curr) => {
        const [action, [panelOrders, panelMode]] = curr
        return [{
          action,
          panelOrders,
          panelMode,
        }, ...acc.slice(0, 1)]
      }, [] as any[]),
      filter(([ { panelMode } ]) => panelMode === PANELS.SINGLE_PANEL),
      map(arr => {
        const {
          action,
          panelOrders,
        } = arr[0]

        const {
          panelOrders: panelOrdersPrev = null,
        } = arr[1] || {}

        const { payload } = action as ActionInterface
        const { index = 0 } = payload

        const panelOrder = panelOrdersPrev || [...panelOrders.slice(index), ...panelOrders.slice(0, index)].join('')

        return ngViewerActionSetPanelOrder({
          payload: { panelOrder }
        })
      }),
    )

    const scanFn = (acc: string[], curr: string): string[] => [curr, ...acc.slice(0, 1)]

    this.toggleMaximiseMode$ = toggleMaxmimise$.pipe(
      withLatestFrom(this.panelMode$.pipe(
        scan(scanFn, []),
      )),
      map(([ _, panelModes ]) => {
        return ngViewerActionSwitchPanelMode({
          payload: {
            panelMode: panelModes[0] === PANELS.SINGLE_PANEL
              ? (panelModes[1] || PANELS.FOUR_PANEL)
              : PANELS.SINGLE_PANEL,
          },
        })
      }),
    )

    this.toggleMaximiseCycleMessage$ = combineLatest([
      this.toggleMaximiseMode$,
      this.pureConstantService.useTouchUI$,
    ]).pipe(
      filter(([_, useMobileUI]) => !useMobileUI),
      map(([toggleMaximiseMode, _]) => toggleMaximiseMode),
      filter(({ payload }) => payload.panelMode && payload.panelMode === PANELS.SINGLE_PANEL),
      mapTo(uiActionSnackbarMessage({
        snackbarMessage: CYCLE_PANEL_MESSAGE
      })),
    )

    /**
     * simplify with layer browser
     */
    const baseNgLayerName$ = this.store$.pipe(
      select(viewerStateSelectedTemplateSelector),
      
      map(templateSelected => {
        if (!templateSelected) { return [] }

        const { ngId , otherNgIds = []} = templateSelected

        return [
          ngId,
          ...otherNgIds,
          ...templateSelected.parcellations.reduce((acc, curr) => {
            return acc.concat([
              curr.ngId,
              ...getNgIds(curr.regions),
            ])
          }, []),
        ]
      }),
      /**
       * get unique array
       */
      map(nonUniqueArray => Array.from(new Set(nonUniqueArray))),
      /**
       * remove falsy values
       */
      map(arr => arr.filter(v => !!v)),
    )

    const allLoadedNgLayers$ = this.store$.pipe(
      select('viewerState'),
      select('loadedNgLayers'),
    )

    this.removeAllNonBaseLayers$ = this.actions.pipe(
      ofType(ACTION_TYPES.REMOVE_ALL_NONBASE_LAYERS),
      withLatestFrom(
        combineLatest(
          baseNgLayerName$,
          allLoadedNgLayers$,
        ),
      ),
      map(([_, [baseNgLayerNames, loadedNgLayers] ]) => {
        const baseNameSet = new Set(baseNgLayerNames)
        return loadedNgLayers.filter(l => !baseNameSet.has(l.name))
      }),
      map(layer => {
        return ngViewerActionRemoveNgLayer({
          layer
        })
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}

export { INgLayerInterface } 

const ACTION_TYPES = {

  REMOVE_ALL_NONBASE_LAYERS: `REMOVE_ALL_NONBASE_LAYERS`,
}

export const SUPPORTED_PANEL_MODES = [
  PANELS.FOUR_PANEL,
  PANELS.H_ONE_THREE,
  PANELS.V_ONE_THREE,
  PANELS.SINGLE_PANEL,
]

export const NG_VIEWER_ACTION_TYPES = ACTION_TYPES
