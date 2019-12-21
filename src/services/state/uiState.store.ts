import { Injectable, TemplateRef } from '@angular/core';
import { Action, select, Store } from '@ngrx/store'

import { Effect } from "@ngrx/effects";
import { Observable } from "rxjs";
import { filter, map, mapTo, scan, startWith } from "rxjs/operators";
import { COOKIE_VERSION, KG_TOS_VERSION, LOCAL_STORAGE_CONST } from 'src/util/constants'
import { IavRootStoreInterface } from '../stateStore.service'

export const defaultState: StateInterface = {
  mouseOverSegments: [],
  mouseOverSegment: null,

  mouseOverLandmark: null,
  mouseOverUserLandmark: null,

  focusedSidePanel: null,
  sidePanelIsOpen: true,
  sidePanelCurrentViewContent: 'Dataset',
  sidePanelExploreCurrentViewIsOpen: false,

  snackbarMessage: null,

  bottomSheetTemplate: null,

  /**
   * replace with server side logic (?)
   */
  agreedCookies: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_COOKIE) === COOKIE_VERSION,
  agreedKgTos: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS) === KG_TOS_VERSION,
}

export const getStateStore = ({ state = defaultState } = {}) => (prevState: StateInterface = state, action: ActionInterface) => {
  switch (action.type) {
  case MOUSE_OVER_SEGMENTS: {
    const { segments } = action
    return {
      ...prevState,
      mouseOverSegments: segments,
    }
  }
  case MOUSE_OVER_SEGMENT: 
    return {
      ...prevState,
      mouseOverSegment : action.segment,
    }
  case MOUSEOVER_USER_LANDMARK: {
    const { payload = {} } = action
    const { userLandmark: mouseOverUserLandmark = null } = payload
    return {
      ...prevState,
      mouseOverUserLandmark,
    }
  }
  case MOUSE_OVER_LANDMARK:
    return {
      ...prevState,
      mouseOverLandmark : action.landmark,
    }
  case SNACKBAR_MESSAGE: {
    const { snackbarMessage } = action
    /**
       * Need to use symbol here, or repeated snackbarMessage will not trigger new event
       */
    return {
      ...prevState,
      snackbarMessage: Symbol(snackbarMessage),
    }
  }
  case OPEN_SIDE_PANEL:
    return {
      ...prevState,
      sidePanelIsOpen: true,
    }
  case CLOSE_SIDE_PANEL:
    return {
      ...prevState,
      sidePanelIsOpen: false,
    }

  case EXPAND_SIDE_PANEL_CURRENT_VIEW:
    return {
      ...prevState,
      sidePanelExploreCurrentViewIsOpen: true,
    }
  case COLLAPSE_SIDE_PANEL_CURRENT_VIEW:
    return {
      ...prevState,
      sidePanelExploreCurrentViewIsOpen: false,
    }

  case SHOW_SIDE_PANEL_DATASET_LIST:
    return {
      ...prevState,
      sidePanelCurrentViewContent: 'Dataset',
    }

  case SHOW_SIDE_PANEL_CONNECTIVITY:
    return {
      ...prevState,
      sidePanelCurrentViewContent: 'Connectivity',
    }
  case HIDE_SIDE_PANEL_CONNECTIVITY:
    return {
      ...prevState,
      sidePanelCurrentViewContent: 'Dataset',
    }
  case AGREE_COOKIE: {
    /**
       * TODO replace with server side logic
       */
    localStorage.setItem(LOCAL_STORAGE_CONST.AGREE_COOKIE, COOKIE_VERSION)
    return {
      ...prevState,
      agreedCookies: true,
    }
  }
  case AGREE_KG_TOS: {
    /**
       * TODO replace with server side logic
       */
    localStorage.setItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS, KG_TOS_VERSION)
    return {
      ...prevState,
      agreedKgTos: true,
    }
  }
  case SHOW_BOTTOM_SHEET: {
    const { bottomSheetTemplate } = action
    return {
      ...prevState,
      bottomSheetTemplate,
    }
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

export interface StateInterface {
  mouseOverSegments: Array<{
    layer: {
      name: string
    }
    segment: any | null
  }>
  sidePanelIsOpen: boolean
  sidePanelCurrentViewContent: 'Connectivity' | 'Dataset' | null
  sidePanelExploreCurrentViewIsOpen: boolean
  mouseOverSegment: any | number

  mouseOverLandmark: any
  mouseOverUserLandmark: any

  focusedSidePanel: string | null

  snackbarMessage: symbol

  agreedCookies: boolean
  agreedKgTos: boolean

  bottomSheetTemplate: TemplateRef<any>
}

export interface ActionInterface extends Action {
  segment: any | number
  landmark: any
  focusedSidePanel?: string
  segments?: Array<{
    layer: {
      name: string
    }
    segment: any | null
  }>
  snackbarMessage: string

  bottomSheetTemplate: TemplateRef<any>

  payload: any
}

@Injectable({
  providedIn: 'root',
})

export class UiStateUseEffect {

  private numRegionSelectedWithHistory$: Observable<any[]>

  @Effect()
  public sidePanelOpen$: Observable<any>

  @Effect()
  public viewCurrentOpen$: Observable<any>

  constructor(store$: Store<IavRootStoreInterface>) {
    this.numRegionSelectedWithHistory$ = store$.pipe(
      select('viewerState'),
      select('regionsSelected'),
      map(arr => arr.length),
      startWith(0),
      scan((acc, curr) => [curr, ...acc], []),
    )

    this.sidePanelOpen$ = this.numRegionSelectedWithHistory$.pipe(
      filter(([curr, prev]) => prev === 0 && curr > 0),
      mapTo({
        type: OPEN_SIDE_PANEL,
      }),
    )

    this.viewCurrentOpen$ = this.numRegionSelectedWithHistory$.pipe(
      filter(([curr, prev]) => prev === 0 && curr > 0),
      mapTo({
        type: EXPAND_SIDE_PANEL_CURRENT_VIEW,
      }),
    )
  }
}

export const MOUSE_OVER_SEGMENT = `MOUSE_OVER_SEGMENT`
export const MOUSE_OVER_SEGMENTS = `MOUSE_OVER_SEGMENTS`
export const MOUSE_OVER_LANDMARK = `MOUSE_OVER_LANDMARK`
export const MOUSEOVER_USER_LANDMARK = `MOUSEOVER_USER_LANDMARK`

export const CLOSE_SIDE_PANEL = `CLOSE_SIDE_PANEL`
export const OPEN_SIDE_PANEL = `OPEN_SIDE_PANEL`
export const SHOW_SIDE_PANEL_DATASET_LIST = `SHOW_SIDE_PANEL_DATASET_LIST`
export const SHOW_SIDE_PANEL_CONNECTIVITY = `SHOW_SIDE_PANEL_CONNECTIVITY`
export const HIDE_SIDE_PANEL_CONNECTIVITY = `HIDE_SIDE_PANEL_CONNECTIVITY`
export const COLLAPSE_SIDE_PANEL_CURRENT_VIEW = `COLLAPSE_SIDE_PANEL_CURRENT_VIEW`
export const EXPAND_SIDE_PANEL_CURRENT_VIEW = `EXPAND_SIDE_PANEL_CURRENT_VIEW`

export const AGREE_COOKIE = `AGREE_COOKIE`
export const AGREE_KG_TOS = `AGREE_KG_TOS`
export const SHOW_KG_TOS = `SHOW_KG_TOS`

export const SNACKBAR_MESSAGE = `SNACKBAR_MESSAGE`
export const SHOW_BOTTOM_SHEET = `SHOW_BOTTOM_SHEET`
