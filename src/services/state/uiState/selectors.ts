import { createSelector } from "@ngrx/store";

export const uiStatePreviewingDatasetFilesSelector = createSelector(
  state => state['uiState'],
  uiState => uiState['previewingDatasetFiles']
)
