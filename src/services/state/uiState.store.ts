import { Action } from '@ngrx/store'
import { TemplateRef } from '@angular/core';

import { LOCAL_STORAGE_CONST, COOKIE_VERSION, KG_TOS_VERSION } from 'src/util/constants'
import { GENERAL_ACTION_TYPES } from '../stateStore.service'

export const defaultState: StateInterface = {
  mouseOverSegments: [],
  mouseOverSegment: null,
  
  mouseOverLandmark: null,
  mouseOverUserLandmark: null,

  focusedSidePanel: null,
  sidePanelOpen: false,

  snackbarMessage: null,

  bottomSheetTemplate: null,

  /**
   * replace with server side logic (?)
   */
  agreedCookies: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_COOKIE) === COOKIE_VERSION,
  agreedKgTos: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS) === KG_TOS_VERSION
}

export const getStateStore = ({ state = defaultState } = {}) => (prevState:StateInterface = state,action:ActionInterface) => {
  switch(action.type){
    case MOUSE_OVER_SEGMENTS:
      const { segments } = action
      return {
        ...prevState,
        mouseOverSegments: segments
      }
    case MOUSE_OVER_SEGMENT:
      return {
        ...prevState,
        mouseOverSegment : action.segment
      }
    case MOUSEOVER_USER_LANDMARK:
      const { payload = {} } = action
      const { userLandmark: mouseOverUserLandmark = null } = payload
      return {
        ...prevState,
        mouseOverUserLandmark
      }
    case MOUSE_OVER_LANDMARK:
      return {
        ...prevState,
        mouseOverLandmark : action.landmark
      }
    case SNACKBAR_MESSAGE:
      const { snackbarMessage } = action
      /**
       * Need to use symbol here, or repeated snackbarMessage will not trigger new event
       */
      return {
        ...prevState,
        snackbarMessage: Symbol(snackbarMessage)
      }
    /**
     * TODO deprecated
     * remove ASAP
     */
    case TOGGLE_SIDE_PANEL:
      return {
        ...prevState,
        sidePanelOpen: !prevState.sidePanelOpen
      }
    case OPEN_SIDE_PANEL:
      return {
        ...prevState,
        sidePanelOpen: true
      }
    case CLOSE_SIDE_PANEL:
      return {
        ...prevState,
        sidePanelOpen: false
      }
    case AGREE_COOKIE:
      /**
       * TODO replace with server side logic
       */
      localStorage.setItem(LOCAL_STORAGE_CONST.AGREE_COOKIE, COOKIE_VERSION)
      return {
        ...prevState,
        agreedCookies: true
      }
    case AGREE_KG_TOS:
      /**
       * TODO replace with server side logic
       */
      localStorage.setItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS, KG_TOS_VERSION)
      return {
        ...prevState,
        agreedKgTos: true
      }
    case SHOW_BOTTOM_SHEET:
        const { bottomSheetTemplate } = action
        return {
          ...prevState,
          bottomSheetTemplate
        }
    default:
      return prevState
  }
}

// must export a named function for aot compilation
// see https://github.com/angular/angular/issues/15587
// https://github.com/amcdnl/ngrx-actions/issues/23 
// or just google for:
//
// angular function expressions are not supported in decorators

const defaultStateStore = getStateStore()

export function stateStore(state, action){
  return defaultStateStore(state, action)
}

export interface StateInterface{
  mouseOverSegments: {
    layer: {
      name: string
    }
    segment: any | null
  }[]
  sidePanelOpen: boolean
  mouseOverSegment: any | number

  mouseOverLandmark: any
  mouseOverUserLandmark: any

  focusedSidePanel: string | null

  snackbarMessage: Symbol

  agreedCookies: boolean
  agreedKgTos: boolean

  bottomSheetTemplate: TemplateRef<any>
}

export interface ActionInterface extends Action{
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

export const TOGGLE_SIDE_PANEL = 'TOGGLE_SIDE_PANEL'
export const CLOSE_SIDE_PANEL = `CLOSE_SIDE_PANEL`
export const OPEN_SIDE_PANEL = `OPEN_SIDE_PANEL`

export const AGREE_COOKIE = `AGREE_COOKIE`
export const AGREE_KG_TOS = `AGREE_KG_TOS`
export const SHOW_KG_TOS = `SHOW_KG_TOS`

export const SNACKBAR_MESSAGE = `SNACKBAR_MESSAGE`
export const SHOW_BOTTOM_SHEET = `SHOW_BOTTOM_SHEET`