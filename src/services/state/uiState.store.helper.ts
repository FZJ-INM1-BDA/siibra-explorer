// TODO merge with uiState.store.ts after refactor completes

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
  uiActionSnackbarMessage,
  uiActionMouseoverLandmark,
  uiActionMouseoverSegments,
} from './uiState/actions'

export {
  uiStatePreviewingDatasetFilesSelector,
  uiStateMouseOverSegmentsSelector,
  uiStateMouseoverUserLandmark,
  uiStateShownDatasetIdSelector,
} from './uiState/selectors'

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

export const SHOW_KG_TOS = `SHOW_KG_TOS`