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

  mouseOverLandmark: any
  mouseOverUserLandmark: any

  focusedSidePanel: string | null

  snackbarMessage: Symbol

  agreedCookies: boolean
  agreedKgTos: boolean
}
