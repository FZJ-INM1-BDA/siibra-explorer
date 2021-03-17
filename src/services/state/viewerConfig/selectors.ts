import { createSelector } from "@ngrx/store";

export const selectViewerConfigAnimationFlag = createSelector(
  state => state['viewerConfigState'],
  viewerConfigState => viewerConfigState['animation']
)
