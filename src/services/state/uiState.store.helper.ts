// TODO merge with uiState.store.ts after refactor completes

import {
  uiActionSetPreviewingDatasetFiles,
  uiActionShowSidePanelConnectivity,
  uiStateCloseSidePanel,
  uiStateCollapseSidePanel,
  uiStateExpandSidePanel,
  uiStateOpenSidePanel,
  uiStateShowBottomSheet,
  uiActionHideDatasetWithId,
  uiActionShowDatasetWtihId,
} from './uiState/actions'

export {
  uiActionSetPreviewingDatasetFiles,
  uiActionShowSidePanelConnectivity,
  uiStateCloseSidePanel,
  uiStateCollapseSidePanel,
  uiStateExpandSidePanel,
  uiStateOpenSidePanel,
  uiStateShowBottomSheet,
  uiActionHideDatasetWithId,
  uiActionShowDatasetWtihId,
}

import {
  uiStatePreviewingDatasetFilesSelector,
  uiStateMouseOverSegmentsSelector,
  uiStateMouseoverUserLandmark,
  uiStateShownDatasetIdSelector,
} from './uiState/selectors'

export {
  uiStatePreviewingDatasetFilesSelector,
  uiStateMouseOverSegmentsSelector,
  uiStateMouseoverUserLandmark,
  uiStateShownDatasetIdSelector,
}

export enum EnumWidgetTypes{
  DATASET_PREVIEW,
}

export interface IDatasetPreviewData{
  datasetId: string
  filename: string
  datasetSchema?: string
}

export type TypeOpenedWidget = {
  type: EnumWidgetTypes
  data: IDatasetPreviewData
}
