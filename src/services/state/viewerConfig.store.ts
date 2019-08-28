import { Action } from "@ngrx/store";

export interface ViewerConfiguration{
  gpuLimit: number
  animation: boolean
}

interface ViewerConfigurationAction extends Action{
  config: Partial<ViewerConfiguration>,
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
  CHANGE_GPU_LIMIT: `CHANGE_GPU_LIMIT`
}

export const LOCAL_STORAGE_CONST = {
  GPU_LIMIT: 'iv-gpulimit',
  ANIMATION: 'iv-animationFlag'
}

const lsGpuLimit = localStorage.getItem(LOCAL_STORAGE_CONST.GPU_LIMIT)
const lsAnimationFlag = localStorage.getItem(LOCAL_STORAGE_CONST.ANIMATION)
const gpuLimit = lsGpuLimit && !isNaN(Number(lsGpuLimit))
  ? Number(lsGpuLimit)
  : CONFIG_CONSTANTS.defaultGpuLimit

const animation = lsAnimationFlag && lsAnimationFlag === 'true'
  ? true
  : lsAnimationFlag === 'false'
    ? false
    : CONFIG_CONSTANTS.defaultAnimation

export function viewerConfigState(prevState:ViewerConfiguration = {animation, gpuLimit}, action:ViewerConfigurationAction) {
  switch (action.type) {
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
    default:
      return prevState
  }
}