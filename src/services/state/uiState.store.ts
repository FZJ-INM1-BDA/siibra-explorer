import { Action } from '@ngrx/store'
import { TemplateRef } from '@angular/core';

const agreedCookieKey = 'agreed-cokies'
const aggredKgTosKey = 'agreed-kg-tos'

const defaultState : UIStateInterface = {
  mouseOverSegments: [],
  mouseOverSegment: null,
  mouseOverLandmark: null,
  focusedSidePanel: null,
  sidePanelOpen: false,

  snackbarMessage: null,

  sidebarTemplate: null,
  bottomSheetTemplate: null,

  /**
   * replace with server side logic (?)
   */
  agreedCookies: localStorage.getItem(agreedCookieKey) === 'agreed',
  agreedKgTos: localStorage.getItem(aggredKgTosKey) === 'agreed'
}

export function uiState(state:UIStateInterface = defaultState,action:UIAction){
  switch(action.type){
    case MOUSE_OVER_SEGMENTS:
      const { segments } = action
      return {
        ...state,
        mouseOverSegments: segments
      }
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
    case SNACKBAR_MESSAGE:
      const { snackbarMessage } = action
      /**
       * Need to use symbol here, or repeated snackbarMessage will not trigger new event
       */
      return {
        ...state,
        snackbarMessage: Symbol(snackbarMessage)
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
    case SHOW_SIDEBAR_TEMPLATE:
      const { sidebarTemplate } = action
      return {
        ...state,
        sidebarTemplate
      }
    case SHOW_BOTTOM_SHEET:
        const { bottomSheetTemplate } = action
        return {
          ...state,
          bottomSheetTemplate
        }
    default:
      return state
  }
}

export interface UIStateInterface{
  mouseOverSegments: {
    layer: {
      name: string
    }
    segment: any | null
  }[]
  sidePanelOpen : boolean
  mouseOverSegment : any | number
  mouseOverLandmark : any 
  focusedSidePanel : string | null

  snackbarMessage: Symbol

  agreedCookies: boolean
  agreedKgTos: boolean

  sidebarTemplate: TemplateRef<any>
  bottomSheetTemplate: TemplateRef<any>
}

export interface UIAction extends Action{
  segment: any | number
  landmark: any
  focusedSidePanel? : string
  segments?:{
    layer: {
      name: string
    }
    segment: any | null
  }[],
  snackbarMessage: string

  sidebarTemplate: TemplateRef<any>
  bottomSheetTemplate: TemplateRef<any>
}

export const MOUSE_OVER_SEGMENT = `MOUSE_OVER_SEGMENT`
export const MOUSE_OVER_SEGMENTS = `MOUSE_OVER_SEGMENTS`
export const MOUSE_OVER_LANDMARK = `MOUSE_OVER_LANDMARK`

export const TOGGLE_SIDE_PANEL = 'TOGGLE_SIDE_PANEL'
export const CLOSE_SIDE_PANEL = `CLOSE_SIDE_PANEL`
export const OPEN_SIDE_PANEL = `OPEN_SIDE_PANEL`

export const AGREE_COOKIE = `AGREE_COOKIE`
export const AGREE_KG_TOS = `AGREE_KG_TOS`
export const SHOW_KG_TOS = `SHOW_KG_TOS`

export const SNACKBAR_MESSAGE = `SNACKBAR_MESSAGE`
export const SHOW_SIDEBAR_TEMPLATE = `SHOW_SIDEBAR_TEMPLATE`
export const SHOW_BOTTOM_SHEET = `SHOW_BOTTOM_SHEET`