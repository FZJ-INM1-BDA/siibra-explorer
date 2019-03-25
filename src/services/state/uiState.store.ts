import { Action } from '@ngrx/store'

export function uiState(state:UIStateInterface = {mouseOverSegment:null, mouseOverLandmark : null, focusedSidePanel:null, sidePanelOpen: false},action:UIAction){
  switch(action.type){
    case MOUSE_OVER_SEGMENT:
      return Object.assign({},state,{
        mouseOverSegment : action.segment
      })
    case MOUSE_OVER_LANDMARK:
      return Object.assign({}, state, {
        mouseOverLandmark : action.landmark
      })
    case TOGGLE_SIDE_PANEL:
      return Object.assign({}, state, {
        focusedSidePanel : typeof action.focusedSidePanel  === 'undefined' || state.focusedSidePanel === action.focusedSidePanel
          ? null
          : action.focusedSidePanel, 
        sidePanelOpen : !(typeof action.focusedSidePanel  === 'undefined' || state.focusedSidePanel === action.focusedSidePanel)
      } as Partial<UIStateInterface>)
    case OPEN_SIDE_PANEL :
      return Object.assign({},state,{
        sidePanelOpen : true
      })
    case CLOSE_SIDE_PANEL :
      return Object.assign({},state,{
        sidePanelOpen : false
      })
    default :
      return state
  }
}

export interface UIStateInterface{
  sidePanelOpen : boolean
  mouseOverSegment : any | number
  mouseOverLandmark : any 
  focusedSidePanel : string | null
}

export interface UIAction extends Action{
  segment : any | number
  landmark : any
  focusedSidePanel? : string
}

export const MOUSE_OVER_SEGMENT = `MOUSE_OVER_SEGMENT`
export const MOUSE_OVER_LANDMARK = `MOUSE_OVER_LANDMARK`

export const TOGGLE_SIDE_PANEL = 'TOGGLE_SIDE_PANEL'
export const CLOSE_SIDE_PANEL = `CLOSE_SIDE_PANEL`
export const OPEN_SIDE_PANEL = `OPEN_SIDE_PANEL`