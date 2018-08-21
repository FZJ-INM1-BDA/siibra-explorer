import { Action } from '@ngrx/store'
import { filter } from 'rxjs/operators';
import { UserLandmark } from '../atlasViewer/atlasViewer.apiService.service';

export const NEWVIEWER = 'NEWVIEWER'

export const FETCHED_TEMPLATES = 'FETCHED_TEMPLATES'
export const SELECT_PARCELLATION = `SELECT_PARCELLATION`
export const SELECT_REGIONS = `SELECT_REGIONS`
export const USER_LANDMARKS = `USER_LANDMARKS`

export const CHANGE_NAVIGATION = 'CHANGE_NAVIGATION'

export const FETCHED_DATAENTRIES = 'FETCHED_DATAENTRIES'
export const FETCHED_METADATA = 'FETCHED_METADATA'
export const FETCHED_SPATIAL_DATA = `FETCHED_SPATIAL_DATA`

export const LOAD_DEDICATED_LAYER = 'LOAD_DEDICATED_LAYER'
export const UNLOAD_DEDICATED_LAYER = 'UNLOAD_DEDICATED_LAYER'

export const SPATIAL_GOTO_PAGE = `SPATIAL_GOTO_PAGE`
export const UPDATE_SPATIAL_DATA = `UPDATE_SPATIAL_DATA`
export const UPDATE_SPATIAL_DATA_VISIBLE = `UPDATE_SPATIAL_DATA_VISIBLE `

export const TOGGLE_SIDE_PANEL = 'TOGGLE_SIDE_PANEL'
export const CLOSE_SIDE_PANEL = `CLOSE_SIDE_PANEL`
export const OPEN_SIDE_PANEL = `OPEN_SIDE_PANEL`

export const MOUSE_OVER_SEGMENT = `MOUSE_OVER_SEGMENT`

export const FETCHED_PLUGIN_MANIFESTS = `FETCHED_PLUGIN_MANIFESTS`
export const LAUNCH_PLUGIN = `LAUNCH_PLUGIN`

export interface ViewerStateInterface{
  fetchedTemplates : any[]

  templateSelected : any | null
  parcellationSelected : any | null
  regionsSelected : any[]

  userLandmarks : UserLandmark[]

  navigation : any | null
}

export interface AtlasAction extends Action{
  fetchedTemplate? : any[]

  selectTemplate? : any
  selectParcellation? : any
  selectRegions? : any[]
  dedicatedView? : string 

  landmarks : UserLandmark[]

  navigation? : any
}

export interface NewViewerAction extends Action{
  selectTemplate : any,
  selectParcellation :any
}

export interface DatasetAction extends Action{
  fetchedDataEntries : DataEntry[]
  fetchedSpatialData : DataEntry[]
  fetchedMetadataMap : Map<string,Map<string,{properties:Property}>>
}

export interface DataStateInterface{
  fetchedDataEntries : DataEntry[]

  /**
   * Map that maps parcellation name to a Map, which maps datasetname to Property Object
   */
  fetchedMetadataMap : Map<string,Map<string,{properties:Property}>>
}

export function uiState(state:UIStateInterface,action:UIAction){
  switch(action.type){
    case MOUSE_OVER_SEGMENT:
      return Object.assign({},state,{
        mouseOverSegment : action.segment
      })
    case TOGGLE_SIDE_PANEL:
      return Object.assign({}, state, {
        focusedSidePanel : typeof action.focusedSidePanel  === 'undefined' || state.focusedSidePanel === action.focusedSidePanel
          ? null
          : action.focusedSidePanel, 
        sidePanelOpen : !(typeof action.focusedSidePanel  === 'undefined' || state.focusedSidePanel === action.focusedSidePanel)
      } as Partial<UIStateInterface>)
    case OPEN_SIDE_PANEL :
      return Object.assign({},state,{
        sidePanelOpen : true
      })
    case CLOSE_SIDE_PANEL :
      return Object.assign({},state,{
        sidePanelOpen : false
      })
    default :
      return state
  }
}

export function viewerState(state:ViewerStateInterface,action:AtlasAction){
  switch(action.type){
    case LOAD_DEDICATED_LAYER:
      return Object.assign({},state,{
        dedicatedView : action.dedicatedView
      })
    case UNLOAD_DEDICATED_LAYER:
      return Object.assign({},state,{
        dedicatedView : null
      })
    case NEWVIEWER:
      return Object.assign({},state,{
        templateSelected : action.selectTemplate,
        parcellationSelected : action.selectParcellation,
        regionsSelected : [],
        navigation : {},
        dedicatedView : null
      })
    case FETCHED_TEMPLATES : {
      return Object.assign({},state,{
        fetchedTemplates:action.fetchedTemplate})
    }
    case CHANGE_NAVIGATION : {
      return Object.assign({},state,{navigation : action.navigation})
    }
    case SELECT_PARCELLATION : {
      return Object.assign({},state,{
        parcellationSelected : action.selectParcellation,
        regionsSelected : []
      })
    }
    case SELECT_REGIONS : {
      return Object.assign({},state,{
        regionsSelected : action.selectRegions.map(region=>Object.assign({},region,{
          labelIndex : Number(region.labelIndex)
        }))
      })
    }
    case USER_LANDMARKS : {
      return Object.assign({}, state, {
        userLandmarks : action.landmarks
      })
    }
    default :
      return state
  }
}

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

export interface SpatialDataEntries extends Action
{
  pageNo? : number
  totalResults? : number
  visible? : boolean
}

export interface SpatialDataStateInterface{
  spatialSearchPagination : number
  spatialSearchTotalResults : number
  spatialDataVisible : boolean
}

const initSpatialDataState : SpatialDataStateInterface = {
  spatialDataVisible : false,
  spatialSearchPagination : 0, 
  spatialSearchTotalResults : 0
}

export function spatialSearchState(state:SpatialDataStateInterface = initSpatialDataState, action:SpatialDataEntries){
  switch (action.type){
    case SPATIAL_GOTO_PAGE:
      return Object.assign({},state,{
        spatialSearchPagination : action.pageNo
      })
    case UPDATE_SPATIAL_DATA:
      return Object.assign({},state,{
        spatialSearchTotalResults : action.totalResults
      })
    case UPDATE_SPATIAL_DATA_VISIBLE:
      return Object.assign({},state,{
        spatialDataVisible : action.visible
      })
    default :
      return state
  }
}

export function safeFilter(key:string){
  return filter((state:any)=>
    (typeof state !== 'undefined' && state !== null) &&
    typeof state[key] !== 'undefined' && state[key] !== null) 
}

export function extractLabelIdx(region:any):number[]{
  return region.children.reduce((acc,item)=>{
    return acc.concat(extractLabelIdx(item))
  },[]).concat( region.labelIndex ? Number(region.labelIndex) : [] )
}

export function getLabelIndexMap(regions:any[]):Map<number,any>{
  const returnMap = new Map()

  const reduceRegions = (regions:any[]) => {
    regions.forEach(region=>{
      if( region.labelIndex ) returnMap.set(Number(region.labelIndex),
        Object.assign({},region,{labelIndex : Number(region.labelIndex)}))
      if( region.children && region.children.constructor === Array ) reduceRegions(region.children)
    })
  }

  reduceRegions(regions)
  return returnMap
} 

export interface DedicatedViewState{
  dedicatedView : string | null
}

export interface DedicatedViewAction extends Action{
  dedicatedView : string | null
}

export interface DataEntry{
  type : string
  name : string
  regionName : {
    regionName : string,
    relationship : string
  }[]

  properties : Property

  files : File[]
}

export interface File{
  filename : string
  name : string
  mimetype : string
  url? : string
  data? : any
  targetParcellation : string
  properties : any
}

export interface Property{
  description : string
  publications : Publication[]
}

export interface Publication{
  doi : string
  citation : string
}

export interface UIStateInterface{
  sidePanelOpen : boolean
  mouseOverSegment : any | number
  focusedSidePanel : string | null
}

export interface UIAction extends Action{
  segment : any | number
  focusedSidePanel? : string
}

export function isDefined(obj){
  return typeof obj !== 'undefined' && obj !== null
}