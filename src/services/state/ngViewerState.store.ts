import { Action, Store, select } from '@ngrx/store'
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, combineLatest, fromEvent, Subscription } from 'rxjs';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { withLatestFrom, map, distinctUntilChanged, scan, shareReplay, filter, mapTo, tap, delay } from 'rxjs/operators';
import { AtlasViewerConstantsServices } from 'src/atlasViewer/atlasViewer.constantService.service';
import { SNACKBAR_MESSAGE } from './uiState.store';

export const FOUR_PANEL = 'FOUR_PANEL'
export const V_ONE_THREE = 'V_ONE_THREE'
export const H_ONE_THREE = 'H_ONE_THREE'
export const SINGLE_PANEL = 'SINGLE_PANEL'

export interface NgViewerStateInterface{
  layers : NgLayerInterface[]
  forceShowSegment : boolean | null
  nehubaReady: boolean
  panelMode: string
  panelOrder: string

  showSubstrate: boolean
  showZoomlevel: boolean
}

export interface NgViewerAction extends Action{
  layer : NgLayerInterface
  forceShowSegment : boolean
  nehubaReady: boolean
  payload: any
}

const defaultState:NgViewerStateInterface = {
  layers:[],
  forceShowSegment:null,
  nehubaReady: false,
  panelMode: FOUR_PANEL,
  panelOrder: `0123`,

  showSubstrate: null,
  showZoomlevel: null
}

export function ngViewerState(prevState:NgViewerStateInterface = defaultState, action:NgViewerAction):NgViewerStateInterface{
  switch(action.type){
    case ACTION_TYPES.SET_PANEL_ORDER: {
      const { payload } = action
      const { panelOrder } = payload

      return {
        ...prevState,
        panelOrder
      }
    }
    case ACTION_TYPES.SWITCH_PANEL_MODE: {
      const { payload } = action
      const { panelMode } = payload
      if (SUPPORTED_PANEL_MODES.indexOf(panelMode) < 0) return prevState
      return {
        ...prevState,
        panelMode
      }
    }
    case ADD_NG_LAYER:
      return {
        ...prevState,

        /* this configration hides the layer if a non mixable layer already present */

        /* this configuration does not the addition of multiple non mixable layers */
        // layers : action.layer.mixability === 'nonmixable' && prevState.layers.findIndex(l => l.mixability === 'nonmixable') >= 0
        //   ? prevState.layers
        //   : prevState.layers.concat(action.layer)

        /* this configuration allows the addition of multiple non mixables */
        // layers : prevState.layers.map(l => mapLayer(l, action.layer)).concat(action.layer)
        layers : action.layer.constructor === Array 
          ? prevState.layers.concat(action.layer)
          : prevState.layers.concat({
            ...action.layer,
            ...( action.layer.mixability === 'nonmixable' && prevState.layers.findIndex(l => l.mixability === 'nonmixable') >= 0
                  ? {visible: false}
                  : {})
          })
      } 
    case REMOVE_NG_LAYER:
      return {
        ...prevState,
        layers : prevState.layers.filter(l => l.name !== action.layer.name)
      }
    case SHOW_NG_LAYER:
      return {
        ...prevState,
        layers : prevState.layers.map(l => l.name === action.layer.name
          ? { ...l, visible: true }
          : l)
      }
    case HIDE_NG_LAYER:
      return {
        ...prevState,

        layers : prevState.layers.map(l => l.name === action.layer.name
          ? { ...l, visible: false }
          : l)
      }
    case FORCE_SHOW_SEGMENT:
      return {
        ...prevState,
        forceShowSegment : action.forceShowSegment
      }
    case NEHUBA_READY: 
      const { nehubaReady } = action
      return {
        ...prevState,
        nehubaReady
      }
    default: return prevState
  }
}

@Injectable({
  providedIn: 'root'
})

export class NgViewerUseEffect implements OnDestroy{
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

  private panelOrder$: Observable<string>
  private panelMode$: Observable<string>

  private subscriptions: Subscription[] = []

  constructor(
    private actions: Actions,
    private store$: Store<any>,
    private constantService: AtlasViewerConstantsServices
  ){
    const toggleMaxmimise$ = this.actions.pipe(
      ofType(ACTION_TYPES.TOGGLE_MAXIMISE),
      shareReplay(1)
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
            panelOrder: [...panelOrder.slice(1), ...panelOrder.slice(0,1)].join('')
          }
        }
      })
    )

    this.maximiseOrder$ = toggleMaxmimise$.pipe(
      withLatestFrom(
        combineLatest(
          this.panelOrder$,
          this.panelMode$
        )
      ),
      filter(([_action, [_panelOrder, panelMode]]) => panelMode !== SINGLE_PANEL),
      map(([ action, [ oldPanelOrder ] ]) => {
        const { payload } = action as NgViewerAction
        const { index = 0 } = payload

        const panelOrder = [...oldPanelOrder.slice(index), ...oldPanelOrder.slice(0, index)].join('')
        return {
          type: ACTION_TYPES.SET_PANEL_ORDER,
          payload: {
            panelOrder
          }
        }
      })
    )

    this.unmaximiseOrder$ = toggleMaxmimise$.pipe(
      withLatestFrom(
        combineLatest(
          this.panelOrder$,
          this.panelMode$
        )
      ),
      scan((acc, curr) => {
        const [action, [panelOrders, panelMode]] = curr
        return [{
          action, 
          panelOrders,
          panelMode
        }, ...acc.slice(0, 1)]
      }, [] as any[]),
      filter(([ { panelMode } ]) => panelMode === SINGLE_PANEL),
      map(arr => {
        const {
          action,
          panelOrders
        } = arr[0]

        const {
          panelOrders: panelOrdersPrev = null,
        } = arr[1] || {}

        const { payload } = action as NgViewerAction
        const { index = 0 } = payload

        const panelOrder = !!panelOrdersPrev
          ? panelOrdersPrev
          : [...panelOrders.slice(index), ...panelOrders.slice(0, index)].join('')

        return {
          type: ACTION_TYPES.SET_PANEL_ORDER,
          payload: {
            panelOrder
          }
        }
      })
    )

    this.toggleMaximiseMode$ = toggleMaxmimise$.pipe(
      withLatestFrom(this.panelMode$.pipe(
        scan((acc, curr: string) => [curr, ...acc.slice(0,1)], [])
      )),
      map(([ _, panelModes ]) => {
        return {
          type: ACTION_TYPES.SWITCH_PANEL_MODE,
          payload: {
            panelMode: panelModes[0] === SINGLE_PANEL
              ? (panelModes[1] || FOUR_PANEL)
              : SINGLE_PANEL
          }
        }
      })
    )

    this.toggleMaximiseCycleMessage$ = combineLatest(
      this.toggleMaximiseMode$,
      this.constantService.useMobileUI$
    ).pipe(
      filter(([_, useMobileUI]) => !useMobileUI),
      map(([toggleMaximiseMode, _]) => toggleMaximiseMode),
      filter(({ payload }) => payload.panelMode && payload.panelMode === SINGLE_PANEL),
      mapTo({
        type: SNACKBAR_MESSAGE,
        snackbarMessage: this.constantService.cyclePanelMessage
      })
    )

    this.spacebarListener$ = fromEvent(document.body, 'keydown', { capture: true }).pipe(
      filter((ev: KeyboardEvent) => ev.key === ' '),
      withLatestFrom(this.panelMode$),
      filter(([_ , panelMode]) => panelMode === SINGLE_PANEL),
      mapTo({
        type: ACTION_TYPES.CYCLE_VIEWS
      })
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
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

interface NgLayerInterface{
  name : string
  source : string
  mixability : string // base | mixable | nonmixable
  visible : boolean
  shader? : string
  transform? : any
}

const ACTION_TYPES = {
  SWITCH_PANEL_MODE: 'SWITCH_PANEL_MODE',
  SET_PANEL_ORDER: 'SET_PANEL_ORDER',

  TOGGLE_MAXIMISE: 'TOGGLE_MAXIMISE',
  CYCLE_VIEWS: 'CYCLE_VIEWS'
}

export const SUPPORTED_PANEL_MODES = [
  FOUR_PANEL,
  H_ONE_THREE,
  V_ONE_THREE,
  SINGLE_PANEL,
]


export const NG_VIEWER_ACTION_TYPES = ACTION_TYPES