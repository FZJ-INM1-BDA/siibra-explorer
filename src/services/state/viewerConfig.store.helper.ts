import { createSelector } from "@ngrx/store"

export const VIEWER_CONFIG_FEATURE_KEY = 'viewerConfigState'
export interface IViewerConfigState {
  gpuLimit: number
  animation: boolean
  useMobileUI: boolean
}

// export const viewerConfigSelectorUseMobileUi = createSelector(
//   state => state[VIEWER_CONFIG_FEATURE_KEY],
//   viewerConfigState => viewerConfigState.useMobileUI
// )
