// TODO merge with uiState.store.ts after refactor completes

import {
  uiActionSetPreviewingDatasetFiles,
  uiActionShowSidePanelConnectivity,
  uiStateCloseSidePanel,
  uiStateCollapseSidePanel,
  uiStateExpandSidePanel,
  uiStateOpenSidePanel,
  uiStateShowBottomSheet
} from './uiState/actions'

export {
  uiActionSetPreviewingDatasetFiles,
  uiActionShowSidePanelConnectivity,
  uiStateCloseSidePanel,
  uiStateCollapseSidePanel,
  uiStateExpandSidePanel,
  uiStateOpenSidePanel,
  uiStateShowBottomSheet
}

import {
  uiStatePreviewingDatasetFilesSelector
} from './uiState/selectors'

export {
  uiStatePreviewingDatasetFilesSelector
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
