import { createSelector } from "@ngrx/store";

export const uiStatePreviewingDatasetFilesSelector = createSelector(
  state => state['uiState'],
  uiState => uiState['previewingDatasetFiles']
)

export const uiStateMouseOverSegmentsSelector = createSelector(
  state => state['uiState']['mouseOverSegments'],
  mouseOverSegments => {
    /**
     * filter out the regions explicitly declared `unselectable`
     */
    return mouseOverSegments
      .filter(({ segment }) => {
        if (typeof segment === 'object' && segment !== null) {
          if (segment.unselectable) return false
        }
        return true
      })
  }
)
