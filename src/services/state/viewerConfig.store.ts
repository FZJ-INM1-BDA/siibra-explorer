import { Action } from "@ngrx/store";
import { LOCAL_STORAGE_CONST } from "src/util/constants";

import { IViewerConfigState as StateInterface } from './viewerConfig.store.helper'
import { actionSetMobileUi } from "./viewerState/actions";
export { StateInterface }

interface ViewerConfigurationAction extends Action {
  config: Partial<StateInterface>
  payload: any
}

export const CONFIG_CONSTANTS = {
  /**
   * byets
   */
  gpuLimitMin: 1e8,
  gpuLimitMax: 1e9,
  defaultGpuLimit: 1e9,
  defaultAnimation: true,
}

export const VIEWER_CONFIG_ACTION_TYPES = {
  SET_ANIMATION: `SET_ANIMATION`,
  UPDATE_CONFIG: `UPDATE_CONFIG`,
  SET_MOBILE_UI: actionSetMobileUi.type,
}

// get gpu limit
const lsGpuLimit = localStorage.getItem(LOCAL_STORAGE_CONST.GPU_LIMIT)
const lsAnimationFlag = localStorage.getItem(LOCAL_STORAGE_CONST.ANIMATION)
const gpuLimit = lsGpuLimit && !isNaN(Number(lsGpuLimit))
  ? Number(lsGpuLimit)
  : CONFIG_CONSTANTS.defaultGpuLimit

// get animation flag
const animation = lsAnimationFlag && lsAnimationFlag === 'true'
  ? true
  : lsAnimationFlag === 'false'
    ? false
    : CONFIG_CONSTANTS.defaultAnimation

// get mobile ui setting
// UA sniff only if not useMobileUI not explicitly set
const getIsMobile = () => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/maxTouchPoints
  // CC0 or MIT
  // msMaxTouchPoints is not needed, since IE is not supported
  return 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0
}
const useMobileUIStroageValue = window && window.localStorage && window.localStorage.getItem(LOCAL_STORAGE_CONST.MOBILE_UI)

export const defaultState: StateInterface = {
  animation,
  gpuLimit,
  useMobileUI: (useMobileUIStroageValue && useMobileUIStroageValue === 'true') || getIsMobile(),
}

export const getStateStore = ({ state = defaultState } = {}) => (prevState: StateInterface = state, action: ViewerConfigurationAction) => {
  switch (action.type) {
  case VIEWER_CONFIG_ACTION_TYPES.SET_MOBILE_UI: {
    const { payload } = action
    const { useMobileUI } = payload
    return {
      ...prevState,
      useMobileUI,
    }
  }
  case VIEWER_CONFIG_ACTION_TYPES.UPDATE_CONFIG:
    return {
      ...prevState,
      ...action.config,
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
