export interface IUiState{

  previewingDatasetFiles: {datasetId: string, filename: string}[]

  mouseOverSegments: Array<{
    layer: {
      name: string
    }
    segment: any | null
  }>
  sidePanelIsOpen: boolean
  sidePanelExploreCurrentViewIsOpen: boolean
  mouseOverSegment: any | number

  mouseOverLandmark: string
  mouseOverUserLandmark: any

  focusedSidePanel: string | null

  snackbarMessage: symbol

  agreedCookies: boolean
  agreedKgTos: boolean
}
