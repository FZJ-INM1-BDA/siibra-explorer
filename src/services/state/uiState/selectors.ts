import { createSelector } from "@ngrx/store";
import { IUiState } from './common'

export const uiStatePreviewingDatasetFilesSelector = createSelector(
  state => state['uiState'],
  (uiState: IUiState) => uiState['previewingDatasetFiles']
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

export const uiStateMouseoverUserLandmark = createSelector(
  state => state['uiState'],
  uiState => uiState['mouseOverUserLandmark']
)

export const uiStateShownDatasetIdSelector = createSelector(
  state => state['uiState'],
  uiState => uiState['shownDatasetId']
)
