import { Injectable, OnDestroy } from '@angular/core';
import { Observable, combineLatest, fromEvent, Subscription, from, of } from 'rxjs';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { withLatestFrom, map, distinctUntilChanged, scan, shareReplay, filter, mapTo, debounceTime, catchError, skip, throttleTime } from 'rxjs/operators';
import { AtlasViewerConstantsServices } from 'src/atlasViewer/atlasViewer.constantService.service';
import { SNACKBAR_MESSAGE } from './uiState.store';
import { getNgIds, IavRootStoreInterface, GENERAL_ACTION_TYPES } from '../stateStore.service';
import { Action, select, Store } from '@ngrx/store'
import { BACKENDURL } from 'src/util/constants';
import { HttpClient } from '@angular/common/http';
import { INgLayerInterface, ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer } from './ngViewerState.store.helper'

export const FOUR_PANEL = 'FOUR_PANEL'
export const V_ONE_THREE = 'V_ONE_THREE'
export const H_ONE_THREE = 'H_ONE_THREE'
export const SINGLE_PANEL = 'SINGLE_PANEL'

export function mixNgLayers(oldLayers: INgLayerInterface[], newLayers: INgLayerInterface|INgLayerInterface[]): INgLayerInterface[] {
  if (newLayers instanceof Array) {
    return oldLayers.concat(newLayers)
  } else {
    return oldLayers.concat({
      ...newLayers,
      ...( newLayers.mixability === 'nonmixable' && oldLayers.findIndex(l => l.mixability === 'nonmixable') >= 0
        ? {visible: false}
        : {}),
    })
  }
}

export interface StateInterface {
  layers: INgLayerInterface[]
  forceShowSegment: boolean | null
  nehubaReady: boolean
  panelMode: string
  panelOrder: string

  showSubstrate: boolean
  showZoomlevel: boolean
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
  panelMode: FOUR_PANEL,
  panelOrder: `0123`,

  showSubstrate: null,
  showZoomlevel: null,
}

export const getStateStore = ({ state = defaultState } = {}) => (prevState: StateInterface = state, action: ActionInterface): StateInterface => {
  switch (action.type) {
  case ACTION_TYPES.SET_PANEL_ORDER: {
    const { payload } = action
    const { panelOrder } = payload

    return {
      ...prevState,
      panelOrder,
    }
  }
  case ACTION_TYPES.SWITCH_PANEL_MODE: {
    const { payload } = action
    const { panelMode } = payload
    if (SUPPORTED_PANEL_MODES.indexOf(panelMode) < 0) { return prevState }
    return {
      ...prevState,
      panelMode,
    }
  }
  case ngViewerActionAddNgLayer.type:
  case ADD_NG_LAYER:
    return {
      ...prevState,
      layers : mixNgLayers(prevState.layers, action.layer),
    }
  case ngViewerActionRemoveNgLayer.type:
  case REMOVE_NG_LAYER: {
    if (Array.isArray(action.layer)) {
      const { layer } = action
      const layerNameSet = new Set(layer.map(l => l.name))
      return {
        ...prevState,
        layers: prevState.layers.filter(l => !layerNameSet.has(l.name)),
      }
    } else {
      return {
        ...prevState,
        layers : prevState.layers.filter(l => l.name !== action.layer.name),
      }
    }
  }
  case SHOW_NG_LAYER: 
    return {
      ...prevState,
      layers : prevState.layers.map(l => l.name === action.layer.name
        ? { ...l, visible: true }
        : l),
    }
  case HIDE_NG_LAYER:
    return {
      ...prevState,

      layers : prevState.layers.map(l => l.name === action.layer.name
        ? { ...l, visible: false }
        : l),
    }
  case FORCE_SHOW_SEGMENT:
    return {
      ...prevState,
      forceShowSegment : action.forceShowSegment,
    }
  case NEHUBA_READY: {
    const { nehubaReady } = action
    return {
      ...prevState,
      nehubaReady
    }
  }
  case GENERAL_ACTION_TYPES.APPLY_STATE: {
    const { ngViewerState } = (action as any).state
    return ngViewerState
  }
  default: return prevState
  }
}

// must export a named function for aot compilation
// see https://github.com/angular/angular/issues/15587
// https://github.com/amcdnl/ngrx-actions/issues/23
// or just google for:
//
// angular function expressions are not supported in decorators

const defaultStateStore = getStateStore()

export function stateStore(state, action) {
  return defaultStateStore(state, action)
}

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
  public spacebarListener$: Observable<any>

  @Effect()
  public removeAllNonBaseLayers$: Observable<any>

  private panelOrder$: Observable<string>
  private panelMode$: Observable<string>

  private subscriptions: Subscription[] = []

  @Effect()
  public applySavedUserConfig$: Observable<any>

  constructor(
    private actions: Actions,
    private store$: Store<IavRootStoreInterface>,
    private constantService: AtlasViewerConstantsServices,
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
        this.http.post(`${BACKENDURL}user/config`, JSON.stringify({ ngViewerState }),  {
          headers: {
            'Content-type': 'application/json'
          }
        })
      })
    )

    this.applySavedUserConfig$ = this.http.get(`${BACKENDURL}user/config`).pipe(
      catchError((err,caught) => of(null)),
      filter(v => !!v),
      withLatestFrom(this.store$),
      map(([{ngViewerState: fetchedNgViewerState}, state]) => {
        const { ngViewerState } = state
        return {
          type: GENERAL_ACTION_TYPES.APPLY_STATE,
          state: {
            ...state,
            ngViewerState: {
              ...ngViewerState,
              ...fetchedNgViewerState
            }
          }
        }
      })
    )

    const toggleMaxmimise$ = this.actions.pipe(
      ofType(ACTION_TYPES.TOGGLE_MAXIMISE),
      shareReplay(1),
    )

    this.panelOrder$ = this.store$.pipe(
      select('ngViewerState'),
      select('panelOrder'),
      distinctUntilChanged(),
    )

    this.panelMode$ = this.store$.pipe(
      select('ngViewerState'),
      select('panelMode'),
      distinctUntilChanged(),
    )

    this.cycleViews$ = this.actions.pipe(
      ofType(ACTION_TYPES.CYCLE_VIEWS),
      withLatestFrom(this.panelOrder$),
      map(([_, panelOrder]) => {
        return {
          type: ACTION_TYPES.SET_PANEL_ORDER,
          payload: {
            panelOrder: [...panelOrder.slice(1), ...panelOrder.slice(0, 1)].join(''),
          },
        }
      }),
    )

    this.maximiseOrder$ = toggleMaxmimise$.pipe(
      withLatestFrom(
        combineLatest(
          this.panelOrder$,
          this.panelMode$,
        ),
      ),
      filter(([_action, [_panelOrder, panelMode]]) => panelMode !== SINGLE_PANEL),
      map(([ action, [ oldPanelOrder ] ]) => {
        const { payload } = action as ActionInterface
        const { index = 0 } = payload

        const panelOrder = [...oldPanelOrder.slice(index), ...oldPanelOrder.slice(0, index)].join('')
        return {
          type: ACTION_TYPES.SET_PANEL_ORDER,
          payload: {
            panelOrder,
          },
        }
      }),
    )

    this.unmaximiseOrder$ = toggleMaxmimise$.pipe(
      withLatestFrom(
        combineLatest(
          this.panelOrder$,
          this.panelMode$,
        ),
      ),
      scan((acc, curr) => {
        const [action, [panelOrders, panelMode]] = curr
        return [{
          action,
          panelOrders,
          panelMode,
        }, ...acc.slice(0, 1)]
      }, [] as any[]),
      filter(([ { panelMode } ]) => panelMode === SINGLE_PANEL),
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

        return {
          type: ACTION_TYPES.SET_PANEL_ORDER,
          payload: {
            panelOrder,
          },
        }
      }),
    )

    const scanFn = (acc: string[], curr: string): string[] => [curr, ...acc.slice(0, 1)]

    this.toggleMaximiseMode$ = toggleMaxmimise$.pipe(
      withLatestFrom(this.panelMode$.pipe(
        scan(scanFn, []),
      )),
      map(([ _, panelModes ]) => {
        return {
          type: ACTION_TYPES.SWITCH_PANEL_MODE,
          payload: {
            panelMode: panelModes[0] === SINGLE_PANEL
              ? (panelModes[1] || FOUR_PANEL)
              : SINGLE_PANEL,
          },
        }
      }),
    )

    this.toggleMaximiseCycleMessage$ = combineLatest(
      this.toggleMaximiseMode$,
      this.constantService.useMobileUI$,
    ).pipe(
      filter(([_, useMobileUI]) => !useMobileUI),
      map(([toggleMaximiseMode, _]) => toggleMaximiseMode),
      filter(({ payload }) => payload.panelMode && payload.panelMode === SINGLE_PANEL),
      mapTo({
        type: SNACKBAR_MESSAGE,
        snackbarMessage: this.constantService.cyclePanelMessage,
      }),
    )

    this.spacebarListener$ = fromEvent(document.body, 'keydown', { capture: true }).pipe(
      filter((ev: KeyboardEvent) => ev.key === ' '),
      withLatestFrom(this.panelMode$),
      filter(([_ , panelMode]) => panelMode === SINGLE_PANEL),
      mapTo({
        type: ACTION_TYPES.CYCLE_VIEWS,
      }),
    )

    /**
     * simplify with layer browser
     */
    const baseNgLayerName$ = this.store$.pipe(
      select('viewerState'),
      select('templateSelected'),
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
        return {
          type: REMOVE_NG_LAYER,
          layer,
        }
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}

export const ADD_NG_LAYER = 'ADD_NG_LAYER'
export const REMOVE_NG_LAYER = 'REMOVE_NG_LAYER'
export const SHOW_NG_LAYER = 'SHOW_NG_LAYER'
export const HIDE_NG_LAYER = 'HIDE_NG_LAYER'
export const FORCE_SHOW_SEGMENT = `FORCE_SHOW_SEGMENT`
export const NEHUBA_READY = `NEHUBA_READY`

export { INgLayerInterface } 

const ACTION_TYPES = {
  SWITCH_PANEL_MODE: 'SWITCH_PANEL_MODE',
  SET_PANEL_ORDER: 'SET_PANEL_ORDER',

  TOGGLE_MAXIMISE: 'TOGGLE_MAXIMISE',
  CYCLE_VIEWS: 'CYCLE_VIEWS',

  REMOVE_ALL_NONBASE_LAYERS: `REMOVE_ALL_NONBASE_LAYERS`,
}

export const SUPPORTED_PANEL_MODES = [
  FOUR_PANEL,
  H_ONE_THREE,
  V_ONE_THREE,
  SINGLE_PANEL,
]

export const NG_VIEWER_ACTION_TYPES = ACTION_TYPES
