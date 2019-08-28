import { Action } from '@ngrx/store'

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
  panelOrder: `0123`
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
  SET_PANEL_ORDER: 'SET_PANEL_ORDER'
}

export const SUPPORTED_PANEL_MODES = [
  FOUR_PANEL,
  H_ONE_THREE,
  V_ONE_THREE,
  SINGLE_PANEL,
]


export const NG_VIEWER_ACTION_TYPES = ACTION_TYPES