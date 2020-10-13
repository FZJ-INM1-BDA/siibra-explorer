import { Injectable, TemplateRef, OnDestroy } from '@angular/core';
import { Action, select, Store } from '@ngrx/store'

import { Effect, Actions, ofType } from "@ngrx/effects";
import { Observable, Subscription } from "rxjs";
import { filter, map, mapTo, scan, startWith, take } from "rxjs/operators";
import { COOKIE_VERSION, KG_TOS_VERSION, LOCAL_STORAGE_CONST } from 'src/util/constants'
import { IavRootStoreInterface, GENERAL_ACTION_TYPES } from '../stateStore.service'
import { MatBottomSheetRef, MatBottomSheet } from '@angular/material/bottom-sheet';
import { uiStateCloseSidePanel, uiStateOpenSidePanel, uiStateCollapseSidePanel, uiStateExpandSidePanel, uiActionSetPreviewingDatasetFiles, uiStateShowBottomSheet, uiActionShowSidePanelConnectivity } from './uiState.store.helper';
import { viewerStateMouseOverCustomLandmark } from './viewerState/actions';
import { IUiState } from './uiState/common'
export const defaultState: IUiState = {
  previewingDatasetFiles: [],

  mouseOverSegments: [],
  mouseOverSegment: null,

  mouseOverLandmark: null,
  mouseOverUserLandmark: null,

  focusedSidePanel: null,
  sidePanelIsOpen: false,
  sidePanelExploreCurrentViewIsOpen: false,

  snackbarMessage: null,

  /**
   * replace with server side logic (?)
   */
  agreedCookies: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_COOKIE) === COOKIE_VERSION,
  agreedKgTos: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS) === KG_TOS_VERSION,
}

export { IUiState }

export const getStateStore = ({ state = defaultState } = {}) => (prevState: IUiState = state, action: ActionInterface) => {
  switch (action.type) {
  
  case uiActionSetPreviewingDatasetFiles.type: {
    const { previewingDatasetFiles } = action as any
    return {
      ...prevState,
      previewingDatasetFiles
    }
  }
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
  case viewerStateMouseOverCustomLandmark.type: {
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
  case uiStateOpenSidePanel.type:
  case OPEN_SIDE_PANEL:
    return {
      ...prevState,
      sidePanelIsOpen: true,
    }
  case uiStateCloseSidePanel.type:
  case CLOSE_SIDE_PANEL:
    return {
      ...prevState,
      sidePanelIsOpen: false,
    }
  case uiStateExpandSidePanel.type:
  case EXPAND_SIDE_PANEL_CURRENT_VIEW:
    return {
      ...prevState,
      sidePanelExploreCurrentViewIsOpen: true,
    }
  case uiStateCollapseSidePanel.type:
  case COLLAPSE_SIDE_PANEL_CURRENT_VIEW:
    return {
      ...prevState,
      sidePanelExploreCurrentViewIsOpen: false,
    }

  case uiActionShowSidePanelConnectivity.type:
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
  case GENERAL_ACTION_TYPES.APPLY_STATE: {
    const { uiState } = (action as any).state
    return uiState
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

export class UiStateUseEffect implements OnDestroy{

  private subscriptions: Subscription[] = []

  private numRegionSelectedWithHistory$: Observable<any[]>

  @Effect()
  public sidePanelOpen$: Observable<any>

  @Effect()
  public viewCurrentOpen$: Observable<any>

  private bottomSheetRef: MatBottomSheetRef

  constructor(
    store$: Store<IavRootStoreInterface>,
    actions$: Actions,
    bottomSheet: MatBottomSheet
  ) {
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
    
    this.subscriptions.push(
      actions$.pipe(
        ofType(uiStateShowBottomSheet.type)
      ).subscribe(({ bottomSheetTemplate, config }) => {
        if (!bottomSheetTemplate) {
          if (this.bottomSheetRef) {
            this.bottomSheetRef.dismiss()
            this.bottomSheetRef = null
          }
        } else {
          this.bottomSheetRef = bottomSheet.open(bottomSheetTemplate, config)
          this.bottomSheetRef.afterDismissed().subscribe(() => {
            this.bottomSheetRef = null
          })
        }
      })
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}

export const MOUSE_OVER_SEGMENT = `MOUSE_OVER_SEGMENT`
export const MOUSE_OVER_SEGMENTS = `MOUSE_OVER_SEGMENTS`
export const MOUSE_OVER_LANDMARK = `MOUSE_OVER_LANDMARK`

export const CLOSE_SIDE_PANEL = `CLOSE_SIDE_PANEL`
export const OPEN_SIDE_PANEL = `OPEN_SIDE_PANEL`
export const COLLAPSE_SIDE_PANEL_CURRENT_VIEW = `COLLAPSE_SIDE_PANEL_CURRENT_VIEW`
export const EXPAND_SIDE_PANEL_CURRENT_VIEW = `EXPAND_SIDE_PANEL_CURRENT_VIEW`

export const AGREE_COOKIE = `AGREE_COOKIE`
export const AGREE_KG_TOS = `AGREE_KG_TOS`
export const SHOW_KG_TOS = `SHOW_KG_TOS`

export const SNACKBAR_MESSAGE = `SNACKBAR_MESSAGE`
export const SHOW_BOTTOM_SHEET = `SHOW_BOTTOM_SHEET`
