import { Action } from "@ngrx/store";
import { LOCAL_STORAGE_CONST } from "src/util/constants";

export interface StateInterface{
  gpuLimit: number
  animation: boolean
  useMobileUI: boolean
}

interface ViewerConfigurationAction extends Action{
  config: Partial<StateInterface>,
  payload: any
}

export const CONFIG_CONSTANTS = {
  /**
   * byets
   */
  gpuLimitMin: 1e8, 
  gpuLimitMax: 1e9,
  defaultGpuLimit: 1e9,
  defaultAnimation: true
}

export const ACTION_TYPES = {
  SET_ANIMATION: `SET_ANIMATION`,
  UPDATE_CONFIG: `UPDATE_CONFIG`,
  CHANGE_GPU_LIMIT: `CHANGE_GPU_LIMIT`,
  SET_MOBILE_UI: 'SET_MOBILE_UI'
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
  const ua = window && window.navigator && window.navigator.userAgent
    ? window.navigator.userAgent
    : ''

  /* https://stackoverflow.com/a/25394023/6059235 */
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)
}
const useMobileUIStroageValue = window && window.localStorage && window.localStorage.getItem(LOCAL_STORAGE_CONST.MOBILE_UI) 

export const defaultState: StateInterface = {
  animation,
  gpuLimit,
  useMobileUI: (useMobileUIStroageValue && useMobileUIStroageValue === 'true') || getIsMobile()
}

export const getStateStore = ({ state = defaultState } = {}) => (prevState:StateInterface = state, action:ViewerConfigurationAction) => {
  switch (action.type) {
    case ACTION_TYPES.SET_MOBILE_UI:
      const { payload } = action
      const { useMobileUI } = payload
      return {
        ...prevState,
        useMobileUI
      }
    case ACTION_TYPES.UPDATE_CONFIG:
      return {
        ...prevState,
        ...action.config
      }
    case ACTION_TYPES.CHANGE_GPU_LIMIT:
      const newGpuLimit = Math.min(
        CONFIG_CONSTANTS.gpuLimitMax,
        Math.max(
          (prevState.gpuLimit || CONFIG_CONSTANTS.defaultGpuLimit) + action.payload.delta,
          CONFIG_CONSTANTS.gpuLimitMin
        ))
      return {
        ...prevState,
        gpuLimit: newGpuLimit
      }
    default: return prevState
  }
}

export const stateStore = getStateStore()
