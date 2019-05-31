import { Action } from '@ngrx/store'

export interface NgViewerStateInterface{
  layers : NgLayerInterface[]
  forceShowSegment : boolean | null
  nehubaReady: boolean
}

export interface NgViewerAction extends Action{
  layer : NgLayerInterface
  forceShowSegment : boolean
  nehubaReady: boolean
}

const defaultState:NgViewerStateInterface = {layers:[], forceShowSegment:null, nehubaReady: false}

export function ngViewerState(prevState:NgViewerStateInterface = defaultState, action:NgViewerAction):NgViewerStateInterface{
  switch(action.type){
    case ADD_NG_LAYER:
      return Object.assign({}, prevState, {
        /* this configration hides the layer if a non mixable layer already present */
        layers : action.layer.constructor === Array 
          ? prevState.layers.concat(action.layer)
          : prevState.layers.concat(
              Object.assign({}, action.layer, 
                action.layer.mixability === 'nonmixable' && prevState.layers.findIndex(l => l.mixability === 'nonmixable') >= 0
                  ? {visible: false}
                  : {}))
        
        /* this configuration does not the addition of multiple non mixable layers */
        // layers : action.layer.mixability === 'nonmixable' && prevState.layers.findIndex(l => l.mixability === 'nonmixable') >= 0
        //   ? prevState.layers
        //   : prevState.layers.concat(action.layer)

        /* this configuration allows the addition of multiple non mixables */
        // layers : prevState.layers.map(l => mapLayer(l, action.layer)).concat(action.layer)
      })
    case REMOVE_NG_LAYER:
      return Object.assign({}, prevState, {
        layers : prevState.layers.filter(l => l.name !== action.layer.name)
      } as NgViewerStateInterface)
    case SHOW_NG_LAYER:
      return Object.assign({}, prevState, {
        layers : prevState.layers.map(l => l.name === action.layer.name
          ? Object.assign({}, l, {
              visible : true
            } as NgLayerInterface)
          : l)
      })
    case HIDE_NG_LAYER:
      return Object.assign({}, prevState, {
        layers : prevState.layers.map(l => l.name === action.layer.name
          ? Object.assign({}, l, {
              visible : false
            } as NgLayerInterface)
          : l)
        })
    case FORCE_SHOW_SEGMENT:
      return Object.assign({}, prevState, {
        forceShowSegment : action.forceShowSegment
      }) as NgViewerStateInterface
    case NEHUBA_READY: 
      const { nehubaReady } = action
      return {
        ...prevState,
        nehubaReady
      }
    default:
      return prevState
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