/**
 * TODO move to databrowser module
 */

import { Action } from '@ngrx/store'
import { GENERAL_ACTION_TYPES } from '../stateStore.service'
import { LOCAL_STORAGE_CONST } from 'src/util/constants'
import { datastateActionUpdateFavDataset } from './dataState/actions'

/**
 * TODO merge with databrowser.usereffect.ts
 */

export interface DatasetPreview {
  datasetId: string
  filename: string
}

export interface IStateInterface {
  fetchedDataEntries: IDataEntry[]
  favDataEntries: Partial<IDataEntry>[]
  fetchedSpatialData: IDataEntry[]
}

// TODO deprecate
export const defaultState = {
  fetchedDataEntries: [],
  favDataEntries: (() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CONST.FAV_DATASET)
      const arr = JSON.parse(saved) as any[]
      return arr.every(item => item && !!item.fullId)
        ? arr
        : []
    } catch (e) {
      // TODO propagate error
      return []
    }
  })(),
  fetchedSpatialData: [],
}

export const getStateStore = ({ state: state = defaultState } = {}) => (prevState: IStateInterface = state, action: Partial<IActionInterface>) => {

  switch (action.type) {
  case FETCHED_DATAENTRIES: {
    return {
      ...prevState,
      fetchedDataEntries : action.fetchedDataEntries,
    }
  }
  case FETCHED_SPATIAL_DATA: {
    return {
      ...prevState,
      fetchedSpatialData : action.fetchedDataEntries,
    }
  }
  case datastateActionUpdateFavDataset.type: {
    const { favDataEntries = [] } = action
    return {
      ...prevState,
      favDataEntries,
    }
  }
  case GENERAL_ACTION_TYPES.APPLY_STATE: {
    const { dataStore } = (action as any).state
    return dataStore
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

// TODO deprecate in favour of src/ui/datamodule/constants.ts

export interface IActivity {
  methods: string[]
  preparation: string[]
  protocols: string[]
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
  referenceSpaces: { 
    name: string 
    fullId: string
  }[]
  url?: string
  data?: any
  position?: any
}

export interface IFileSupplementData {
  data: any
}

const ACTION_TYPES = {
  PREVIEW_DATASET: 'PREVIEW_DATASET',
  CLEAR_PREVIEW_DATASET: 'CLEAR_PREVIEW_DATASET',
  CLEAR_PREVIEW_DATASETS: 'CLEAR_PREVIEW_DATASETS'
}

export const DATASETS_ACTIONS_TYPES = ACTION_TYPES
