import { Action } from '@ngrx/store'

export function dataStore(state:any,action:DatasetAction){
  switch (action.type){
    case FETCHED_DATAENTRIES: {
      return Object.assign({},state,{
        fetchedDataEntries : action.fetchedDataEntries
      })
    }
    case FETCHED_SPATIAL_DATA :{
      return Object.assign({},state,{
        fetchedSpatialData : action.fetchedDataEntries
      })
    }
    case FETCHED_METADATA : {
      return Object.assign({},state,{
        fetchedMetadataMap : action.fetchedMetadataMap
      })
    }
    default:
      return state
  }
}

export interface DatasetAction extends Action{
  fetchedDataEntries : DataEntry[]
  fetchedSpatialData : DataEntry[]
  fetchedMetadataMap : Map<string,Map<string,{properties:Property}>>
}

export const FETCHED_DATAENTRIES = 'FETCHED_DATAENTRIES'
export const FETCHED_METADATA = 'FETCHED_METADATA'
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
}

export interface ParcellationRegion {
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
}

export interface FileSupplementData{
  data: any
}