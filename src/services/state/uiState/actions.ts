
import { createAction, props } from '@ngrx/store'
import { TemplateRef } from '@angular/core'
import { MatBottomSheetConfig } from '@angular/material/bottom-sheet'

export const uiStateCloseSidePanel = createAction(
  '[uiState] closeSidePanel'
)

export const uiStateOpenSidePanel = createAction(
  '[uiState] openSidePanel'
)

export const uiStateCollapseSidePanel = createAction(
  '[uiState] collapseSidePanelCurrentView'
)

export const uiStateExpandSidePanel = createAction(
  '[uiState] expandSidePanelCurrentView'
)

export const uiStateShowBottomSheet = createAction(
  '[uiState] showBottomSheet',
  props<{ bottomSheetTemplate: TemplateRef<unknown>, config?: MatBottomSheetConfig }>()
)

export const uiActionMouseoverLandmark = createAction(
  `[uiState] mouseoverLandmark`,
  props<{ landmark: any }>()
)

export const uiActionMouseoverSegments = createAction(
  `[uiState] mouseoverSegments`,
  props<{ segments: any[] }>()
)

export const uiActionSetPreviewingDatasetFiles = createAction(
  `[uiState] setDatasetPreviews`,
  props<{previewingDatasetFiles: {datasetId: string, filename: string}[]}>()
)

export const uiActionShowSidePanelConnectivity = createAction(
  `[uiState] showSidePanelConnectivity`
)

export const uiActionSnackbarMessage = createAction(
  `[uiState] snackbarMessage`,
  props<{snackbarMessage: string}>()
)