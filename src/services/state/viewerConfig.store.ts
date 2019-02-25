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
  gpuLimitMax: 1e9
}

export const ACTION_TYPES = {
  UPDATE_CONFIG: `UPDATE_CONFIG`,
  CHANGE_GPU_LIMIT: `CHANGE_GPU_LIMIT`
}

export function viewerConfigState(prevState:ViewerConfiguration = {gpuLimit: 1e9, animation: true}, action:ViewerConfigurationAction) {
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
          prevState.gpuLimit + action.payload.delta,
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