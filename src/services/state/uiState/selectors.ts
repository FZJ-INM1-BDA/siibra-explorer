import { createSelector } from "@ngrx/store";
import { IUiState } from './common'

export const uiStatePreviewingDatasetFilesSelector = createSelector(
  state => state['uiState'],
  (uiState: IUiState) => uiState['previewingDatasetFiles']
)

export const uiStateMouseOverLandmarkSelector = createSelector(
  state => state['uiState'],
  uiState => uiState['mouseOverLandmark'] as string
)

export const uiStateMouseoverUserLandmark = createSelector(
  state => state['uiState'],
  uiState => uiState['mouseOverUserLandmark']
)
