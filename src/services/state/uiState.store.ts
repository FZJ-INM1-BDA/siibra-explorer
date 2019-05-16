import { Action } from '@ngrx/store'

const agreedCookieKey = 'agreed-cokies'
const aggredKgTosKey = 'agreed-kg-tos'

const defaultState : UIStateInterface = {
  mouseOverSegment: null,
  mouseOverLandmark: null,
  focusedSidePanel: null,
  sidePanelOpen: false,

  /**
   * replace with server side logic (?)
   */
  agreedCookies: localStorage.getItem(agreedCookieKey) === 'agreed',
  agreedKgTos: localStorage.getItem(aggredKgTosKey) === 'agreed'
}

export function uiState(state:UIStateInterface = defaultState,action:UIAction){
  switch(action.type){
    case MOUSE_OVER_SEGMENT:
      return {
        ...state,
        mouseOverSegment : action.segment
      }
    case MOUSE_OVER_LANDMARK:
      return {
        ...state,
        mouseOverLandmark : action.landmark
      }
    /**
     * TODO deprecated
     * remove ASAP
     */
    case TOGGLE_SIDE_PANEL:
      return {
        ...state,
        sidePanelOpen: !state.sidePanelOpen
      }
    case OPEN_SIDE_PANEL:
      return {
        ...state,
        sidePanelOpen: true
      }
    case CLOSE_SIDE_PANEL:
      return {
        ...state,
        sidePanelOpen: false
      }
    case AGREE_COOKIE:
      /**
       * TODO replace with server side logic
       */
      localStorage.setItem(agreedCookieKey, 'agreed')
      return {
        ...state,
        agreedCookies: true
      }
    case AGREE_KG_TOS:
      /**
       * TODO replace with server side logic
       */
      localStorage.setItem(aggredKgTosKey, 'agreed')
      return {
        ...state,
        agreedKgTos: true
      }
    default:
      return state
  }
}

export interface UIStateInterface{
  sidePanelOpen : boolean
  mouseOverSegment : any | number
  mouseOverLandmark : any 
  focusedSidePanel : string | null

  agreedCookies: boolean
  agreedKgTos: boolean
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

export const AGREE_COOKIE = `AGREE_COOKIE`
export const AGREE_KG_TOS = `AGREE_KG_TOS`
export const SHOW_KG_TOS = `SHOW_KG_TOS`