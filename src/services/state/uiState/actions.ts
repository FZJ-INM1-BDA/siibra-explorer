
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

export const uiActionSetPreviewingDatasetFiles = createAction(
  `[uiState] setDatasetPreviews`,
  props<{previewingDatasetFiles: {datasetId: string, filename: string}[]}>()
)

export const uiActionShowSidePanelConnectivity = createAction(
  `[uiState] showSidePanelConnectivity`
)
