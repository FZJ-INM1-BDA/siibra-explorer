import { Action } from '@ngrx/store'

/**
 * TODO merge with databrowser.usereffect.ts
 */

export interface StateInterface{
  fetchedDataEntries: DataEntry[]
  favDataEntries: DataEntry[]
  fetchedSpatialData: DataEntry[]
}

export const defaultState = {
  fetchedDataEntries: [],
  favDataEntries: [],
  fetchedSpatialData: []
}

export const getStateStore = ({ state: state = defaultState } = {}) => (prevState:StateInterface = state, action:Partial<ActionInterface>) => {

  switch (action.type){
    case FETCHED_DATAENTRIES: {
      return {
        ...prevState,
        fetchedDataEntries : action.fetchedDataEntries
      }
    }
    case FETCHED_SPATIAL_DATA :{
      return {
        ...prevState,
        fetchedSpatialData : action.fetchedDataEntries
      }
    }
    case ACTION_TYPES.UPDATE_FAV_DATASETS: {
      const { favDataEntries = [] } = action
      return {
        ...prevState,
        favDataEntries
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

export function stateStore() {
  return getStateStore()
}

export interface ActionInterface extends Action{
  favDataEntries: DataEntry[]
  fetchedDataEntries : DataEntry[]
  fetchedSpatialData : DataEntry[]
}

export const FETCHED_DATAENTRIES = 'FETCHED_DATAENTRIES'
export const FETCHED_SPATIAL_DATA = `FETCHED_SPATIAL_DATA`

export interface Activity{
  methods: string[]
  preparation: string[]
  protocols: string[  ]
}

export interface DataEntry{
  activity: Activity[]
  name: string
  description: string
  license: string[]
  licenseInfo: string[]
  parcellationRegion: ParcellationRegion[]
  formats: string[]
  custodians: string[]
  contributors: string[]
  referenceSpaces: ReferenceSpace[]
  files : File[]
  publications: Publication[]
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

export interface ParcellationRegion {
  id?: string
  name: string
}

export interface ReferenceSpace {
  name: string
}

export interface Publication{
  name: string
  doi : string
  cite : string
}

export interface Property{
  description : string
  publications : Publication[]
}

export interface Landmark{
  type : string //e.g. sEEG recording site, etc
  name : string
  templateSpace : string // possibily inherited from LandmarkBundle (?)
  geometry : PointLandmarkGeometry | PlaneLandmarkGeometry | OtherLandmarkGeometry
  properties : Property
  files : File[]
}

export interface DataStateInterface{
  fetchedDataEntries : DataEntry[]

  /**
   * Map that maps parcellation name to a Map, which maps datasetname to Property Object
   */
  fetchedMetadataMap : Map<string,Map<string,{properties:Property}>>
}

export interface PointLandmarkGeometry extends LandmarkGeometry{
  position : [number, number, number]
}

export interface PlaneLandmarkGeometry extends LandmarkGeometry{
  // corners have to be CW or CCW (no zigzag)
  corners : [[number, number, number],[number, number, number],[number, number, number],[number, number, number]]
}

export interface OtherLandmarkGeometry extends LandmarkGeometry{
  vertices: [number, number, number][]
  meshIdx: [number,number,number][]
}

interface LandmarkGeometry{
  type : 'point' | 'plane'
  space? : 'voxel' | 'real'
}

export interface File{
  name: string
  absolutePath: string
  byteSize: number
  contentType: string,
}

export interface ViewerPreviewFile{
  name: string
  filename: string
  mimetype: string
  url?: string
  data?: any
  position?: any
}

export interface FileSupplementData{
  data: any
}

const ACTION_TYPES = {
  FAV_DATASET: `FAV_DATASET`,
  UPDATE_FAV_DATASETS: `UPDATE_FAV_DATASETS`,
  UNFAV_DATASET: 'UNFAV_DATASET',
  TOGGLE_FAV_DATASET: 'TOGGLE_FAV_DATASET'
}

export const DATASETS_ACTIONS_TYPES = ACTION_TYPES