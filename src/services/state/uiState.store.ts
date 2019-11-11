import { Action } from '@ngrx/store'
import { TemplateRef } from '@angular/core';

import { LOCAL_STORAGE_CONST, COOKIE_VERSION, KG_TOS_VERSION } from 'src/util/constants'

const defaultState : UIStateInterface = {
  mouseOverSegments: [],
  mouseOverSegment: null,
  
  mouseOverLandmark: null,
  mouseOverUserLandmark: null,

  focusedSidePanel: null,
  sidePanelOpen: true,
  sidePanelManualCollapsibleView: '',
  sidePanelCurrentViewOpened: false,

  snackbarMessage: null,

  bottomSheetTemplate: null,

  /**
   * replace with server side logic (?)
   */
  agreedCookies: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_COOKIE) === COOKIE_VERSION,
  agreedKgTos: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS) === KG_TOS_VERSION
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
    case MOUSEOVER_USER_LANDMARK:
      const { payload = {} } = action
      const { userLandmark: mouseOverUserLandmark = null } = payload
      return {
        ...state,
        mouseOverUserLandmark
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

    case EXPAND_SIDE_PANEL_CURRENT_VIEW:
      return {
        ...state,
        sidePanelCurrentViewOpened: true
      }
    case COLLAPSE_SIDE_PANEL_CURRENT_VIEW:
      return {
        ...state,
        sidePanelCurrentViewOpened: false
      }

    case SHOW_SIDE_PANEL_CONNECTIVITY:
      return {
        ...state,
        sidePanelManualCollapsibleView: 'Connectivity'
      }

    case HIDE_SIDE_PANEL_CONNECTIVITY:
      return {
        ...state,
        sidePanelManualCollapsibleView: ''
      }

    case AGREE_COOKIE:
      /**
       * TODO replace with server side logic
       */
      localStorage.setItem(LOCAL_STORAGE_CONST.AGREE_COOKIE, COOKIE_VERSION)
      return {
        ...state,
        agreedCookies: true
      }
    case AGREE_KG_TOS:
      /**
       * TODO replace with server side logic
       */
      localStorage.setItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS, KG_TOS_VERSION)
      return {
        ...state,
        agreedKgTos: true
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
  sidePanelOpen: boolean
  sidePanelManualCollapsibleView: 'Connectivity' | '' | null
  sidePanelCurrentViewOpened: boolean

  mouseOverSegment: any | number

  mouseOverLandmark: any
  mouseOverUserLandmark: any

  focusedSidePanel: string | null

  snackbarMessage: Symbol

  agreedCookies: boolean
  agreedKgTos: boolean

  bottomSheetTemplate: TemplateRef<any>
}

export interface UIAction extends Action{
  segment: any | number
  landmark: any
  focusedSidePanel?: string
  segments?:{
    layer: {
      name: string
    }
    segment: any | null
  }[],
  snackbarMessage: string

  bottomSheetTemplate: TemplateRef<any>

  payload: any
}

export const MOUSE_OVER_SEGMENT = `MOUSE_OVER_SEGMENT`
export const MOUSE_OVER_SEGMENTS = `MOUSE_OVER_SEGMENTS`
export const MOUSE_OVER_LANDMARK = `MOUSE_OVER_LANDMARK`
export const MOUSEOVER_USER_LANDMARK = `MOUSEOVER_USER_LANDMARK`

export const CLOSE_SIDE_PANEL = `CLOSE_SIDE_PANEL`
export const OPEN_SIDE_PANEL = `OPEN_SIDE_PANEL`
export const SHOW_SIDE_PANEL_CONNECTIVITY = `SHOW_SIDE_PANEL_CONNECTIVITY`
export const HIDE_SIDE_PANEL_CONNECTIVITY = `HIDE_SIDE_PANEL_CONNECTIVITY`
export const COLLAPSE_SIDE_PANEL_CURRENT_VIEW = `COLLAPSE_SIDE_PANEL_CURRENT_VIEW`
export const EXPAND_SIDE_PANEL_CURRENT_VIEW = `EXPAND_SIDE_PANEL_CURRENT_VIEW`


export const AGREE_COOKIE = `AGREE_COOKIE`
export const AGREE_KG_TOS = `AGREE_KG_TOS`
export const SHOW_KG_TOS = `SHOW_KG_TOS`

export const SNACKBAR_MESSAGE = `SNACKBAR_MESSAGE`
export const SHOW_BOTTOM_SHEET = `SHOW_BOTTOM_SHEET`