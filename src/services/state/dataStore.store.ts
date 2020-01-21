import { Action } from '@ngrx/store'

/**
 * TODO merge with databrowser.usereffect.ts
 */

interface DatasetPreview {
  dataset?: IDataEntry
  file: Partial<ViewerPreviewFile>&{filename:string}
}

export interface IStateInterface {
  fetchedDataEntries: IDataEntry[]
  favDataEntries: IDataEntry[]
  fetchedSpatialData: IDataEntry[]
  datasetPreviews: DatasetPreview[]
}

export const defaultState = {
  fetchedDataEntries: [],
  favDataEntries: [],
  fetchedSpatialData: [],
  datasetPreviews: [],
}

export const getStateStore = ({ state: state = defaultState } = {}) => (prevState: IStateInterface = state, action: Partial<IActionInterface>) => {

  switch (action.type) {
  case FETCHED_DATAENTRIES: {
    return {
      ...prevState,
      fetchedDataEntries : action.fetchedDataEntries,
    }
  }
  case FETCHED_SPATIAL_DATA : {
    return {
      ...prevState,
      fetchedSpatialData : action.fetchedDataEntries,
    }
  }
  case ACTION_TYPES.UPDATE_FAV_DATASETS: {
    const { favDataEntries = [] } = action
    return {
      ...prevState,
      favDataEntries,
    }
  }
  case ACTION_TYPES.PREVIEW_DATASET: {

    const { payload = {}} = action
    const { file , dataset } = payload
    return {
      ...prevState,
      datasetPreviews: prevState.datasetPreviews.concat({
        dataset,
        file
      })
    }
  }
  default: return prevState
  }
}

// must export a named function for aot compilation
// see https://github.com/angular/angular/issues/15587
// https://github.com/amcdnl/ngrx-actions/issues/23
// or just google for:
//
// angular function expressions are not supported in decorators

const defaultStateStore = getStateStore()

export function stateStore(state, action) {
  return defaultStateStore(state, action)
}

export interface IActionInterface extends Action {
  favDataEntries: IDataEntry[]
  fetchedDataEntries: IDataEntry[]
  fetchedSpatialData: IDataEntry[]
  payload?: any
}

export const FETCHED_DATAENTRIES = 'FETCHED_DATAENTRIES'
export const FETCHED_SPATIAL_DATA = `FETCHED_SPATIAL_DATA`

export interface IActivity {
  methods: string[]
  preparation: string[]
  protocols: string[  ]
}

export interface IDataEntry {
  activity: IActivity[]
  name: string
  description: string
  license: string[]
  licenseInfo: string[]
  parcellationRegion: IParcellationRegion[]
  formats: string[]
  custodians: string[]
  contributors: string[]
  referenceSpaces: IReferenceSpace[]
  files: File[]
  publications: IPublication[]
  embargoStatus: string[]

  methods: string[]
  protocols: string[]

  preview?: boolean

  /**
   * TODO typo, should be kgReferences
   */
  kgReference: string[]

  id: string
  fullId: string
}

export interface IParcellationRegion {
  id?: string
  name: string
}

export interface IReferenceSpace {
  name: string
}

export interface IPublication {
  name: string
  doi: string
  cite: string
}

export interface IProperty {
  description: string
  publications: IPublication[]
}

export interface ILandmark {
  type: string // e.g. sEEG recording site, etc
  name: string
  templateSpace: string // possibily inherited from LandmarkBundle (?)
  geometry: IPointLandmarkGeometry | IPlaneLandmarkGeometry | IOtherLandmarkGeometry
  properties: IProperty
  files: File[]
}

export interface IDataStateInterface {
  fetchedDataEntries: IDataEntry[]

  /**
   * Map that maps parcellation name to a Map, which maps datasetname to Property Object
   */
  fetchedMetadataMap: Map<string, Map<string, {properties: IProperty}>>
}

export interface IPointLandmarkGeometry extends ILandmarkGeometry {
  position: [number, number, number]
}

export interface IPlaneLandmarkGeometry extends ILandmarkGeometry {
  // corners have to be CW or CCW (no zigzag)
  corners: [[number, number, number], [number, number, number], [number, number, number], [number, number, number]]
}

export interface IOtherLandmarkGeometry extends ILandmarkGeometry {
  vertices: Array<[number, number, number]>
  meshIdx: Array<[number, number, number]>
}

interface ILandmarkGeometry {
  type: 'point' | 'plane'
  space?: 'voxel' | 'real'
}

export interface IFile {
  name: string
  absolutePath: string
  byteSize: number
  contentType: string
}

export interface ViewerPreviewFile {
  name: string
  filename: string
  mimetype: string
  url?: string
  data?: any
  position?: any
}

export interface IFileSupplementData {
  data: any
}

const ACTION_TYPES = {
  FAV_DATASET: `FAV_DATASET`,
  UPDATE_FAV_DATASETS: `UPDATE_FAV_DATASETS`,
  UNFAV_DATASET: 'UNFAV_DATASET',
  TOGGLE_FAV_DATASET: 'TOGGLE_FAV_DATASET',
  PREVIEW_DATASET: 'PREVIEW_DATASET',
}

export const DATASETS_ACTIONS_TYPES = ACTION_TYPES
