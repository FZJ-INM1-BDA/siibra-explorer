import { Action } from '@ngrx/store'
import { filter } from 'rxjs/operators';
import { UserLandmark } from '../atlasViewer/atlasViewer.apiService.service';

export const NEWVIEWER = 'NEWVIEWER'

export const FETCHED_TEMPLATES = 'FETCHED_TEMPLATES'
export const SELECT_PARCELLATION = `SELECT_PARCELLATION`
export const SELECT_REGIONS = `SELECT_REGIONS`
export const DESELECT_REGIONS = `DESELECT_REGIONS`
export const SELECT_LANDMARKS = `SELECT_LANDMARKS`
export const DESELECT_LANDMARKS = `DESELECT_LANDMARKS`
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
export const MOUSE_OVER_LANDMARK = `MOUSE_OVER_LANDMARK`

export const SET_INIT_PLUGIN = `SET_INIT_PLUGIN`
export const FETCHED_PLUGIN_MANIFESTS = `FETCHED_PLUGIN_MANIFESTS`
export const LAUNCH_PLUGIN = `LAUNCH_PLUGIN`

export interface PluginInitManifestInterface{
  initManifests : Map<string,string|null>
}

export interface PluginInitManifestActionInterface extends Action{
  manifest: {
    name : string,
    initManifestUrl : string | null
  }
}

export interface ViewerStateInterface{
  fetchedTemplates : any[]

  templateSelected : any | null
  parcellationSelected : any | null
  regionsSelected : any[]

  landmarksSelected : any[]
  userLandmarks : UserLandmark[]

  navigation : any | null
  dedicatedView : string[]
}

export interface AtlasAction extends Action{
  fetchedTemplate? : any[]

  selectTemplate? : any
  selectParcellation? : any
  selectRegions? : any[]
  deselectRegions? : any[]
  dedicatedView? : string

  landmarks : UserLandmark[]
  deselectLandmarks : UserLandmark[]

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

interface NgLayerInterface{
  name : string
  source : string
  mixability : string // base | mixable | nonmixable
  visible : boolean
  shader? : string
  transform? : any
}

export const ADD_NG_LAYER = 'ADD_NG_LAYER'
export const REMOVE_NG_LAYER = 'REMOVE_NG_LAYER'
export const SHOW_NG_LAYER = 'SHOW_NG_LAYER'
export const HIDE_NG_LAYER = 'HIDE_NG_LAYER'
export const FORCE_SHOW_SEGMENT = `FORCE_SHOW_SEGMENT`

export interface NgViewerStateInterface{
  layers : NgLayerInterface[]
  forceShowSegment : boolean | null
}

export interface NgViewerAction extends Action{
  layer : NgLayerInterface
  forceShowSegment : boolean
}

const mapLayer = (existingLayer:NgLayerInterface, incomingLayer:NgLayerInterface):NgLayerInterface => {
  return incomingLayer.mixability === 'base'
    ? existingLayer
    : incomingLayer.mixability === 'mixable'
      ? existingLayer.mixability === 'nonmixable'
        ? Object.assign({}, existingLayer, {
            visible : false
          } as NgLayerInterface)
        : existingLayer
      /* incomingLayer.mixability === 'nonmixable' */
      : existingLayer.mixability === 'base'
        ? existingLayer
        : Object.assign({}, existingLayer, {
            visible : false
          } as NgLayerInterface)
}

export function pluginState(prevState:PluginInitManifestInterface = {initManifests : new Map()}, action:PluginInitManifestActionInterface):PluginInitManifestInterface{
  switch(action.type){
    case SET_INIT_PLUGIN:
      const newMap = new Map(prevState.initManifests)
      return Object.assign({}, prevState, {
        initManifests : newMap.set(action.manifest.name, action.manifest.initManifestUrl)
      } as PluginInitManifestInterface)
    default:
      return prevState
  }
}

export function ngViewerState(prevState:NgViewerStateInterface = {layers:[], forceShowSegment:null}, action:NgViewerAction):NgViewerStateInterface{
  switch(action.type){
    case ADD_NG_LAYER:
      return Object.assign({}, prevState, {
        /* this configration hides the layer if a non mixable layer already present */
        layers : action.layer.constructor === Array 
          ? prevState.layers.concat(action.layer)
          : prevState.layers.concat(
              Object.assign({}, action.layer, 
                action.layer.mixability === 'nonmixable' && prevState.layers.findIndex(l => l.mixability === 'nonmixable') >= 0
                  ? {visible: false}
                  : {}))
        
        /* this configuration does not the addition of multiple non mixable layers */
        // layers : action.layer.mixability === 'nonmixable' && prevState.layers.findIndex(l => l.mixability === 'nonmixable') >= 0
        //   ? prevState.layers
        //   : prevState.layers.concat(action.layer)

        /* this configuration allows the addition of multiple non mixables */
        // layers : prevState.layers.map(l => mapLayer(l, action.layer)).concat(action.layer)
      })
    case REMOVE_NG_LAYER:
      return Object.assign({}, prevState, {
        layers : prevState.layers.filter(l => l.name !== action.layer.name)
      } as NgViewerStateInterface)
    case SHOW_NG_LAYER:
      return Object.assign({}, prevState, {
        layers : prevState.layers.map(l => l.name === action.layer.name
          ? Object.assign({}, l, {
              visible : true
            } as NgLayerInterface)
          : l)
      })
    case HIDE_NG_LAYER:
      return Object.assign({}, prevState, {
        layers : prevState.layers.map(l => l.name === action.layer.name
          ? Object.assign({}, l, {
              visible : false
            } as NgLayerInterface)
          : l)
        })
    case FORCE_SHOW_SEGMENT:
      return Object.assign({}, prevState, {
        forceShowSegment : action.forceShowSegment
      }) as NgViewerStateInterface
    default:
      return prevState
  }
}

export function uiState(state:UIStateInterface = {mouseOverSegment:null, mouseOverLandmark : null, focusedSidePanel:null, sidePanelOpen: false},action:UIAction){
  switch(action.type){
    case MOUSE_OVER_SEGMENT:
      return Object.assign({},state,{
        mouseOverSegment : action.segment
      })
    case MOUSE_OVER_LANDMARK:
      return Object.assign({}, state, {
        mouseOverLandmark : action.landmark
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

export function viewerState(state:Partial<ViewerStateInterface> = {landmarksSelected : []},action:AtlasAction){
  switch(action.type){
    case LOAD_DEDICATED_LAYER:
      const dedicatedView = state.dedicatedView
        ? state.dedicatedView.concat(action.dedicatedView)
        : [action.dedicatedView]
      return Object.assign({},state,{
        dedicatedView 
      })
    case UNLOAD_DEDICATED_LAYER:
      return Object.assign({},state,{
        dedicatedView : state.dedicatedView
          ? state.dedicatedView.filter(dv => dv !== action.dedicatedView)
          : []
      })
    case NEWVIEWER:
      return Object.assign({},state,{
        templateSelected : action.selectTemplate,
        parcellationSelected : action.selectParcellation,
        regionsSelected : [],
        landmarksSelected : [],
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
    case DESELECT_REGIONS : {
      return Object.assign({}, state, {
        regionsSelected : state.regionsSelected.filter(re => action.deselectRegions.findIndex(dRe => dRe.name === re.name) < 0)
      })
    }
    case SELECT_REGIONS : {
      return Object.assign({},state,{
        regionsSelected : action.selectRegions.map(region=>Object.assign({},region,{
          labelIndex : Number(region.labelIndex)
        }))
      })
    }
    case DESELECT_LANDMARKS : {
      return Object.assign({}, state, {
        landmarksSelected : state.landmarksSelected.filter(lm => action.deselectLandmarks.findIndex(dLm => dLm.name === lm.name) < 0)
      })
    }
    case SELECT_LANDMARKS : {
      return Object.assign({}, state, {
        landmarksSelected : action.landmarks
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
  spatialDataVisible : true,
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
  if(!region.children || region.children.constructor !== Array){
    return isNaN(region.labelIndex) || region.labelIndex === null
      ? []
      : [Number(region.labelIndex)]
  }
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
  kgID? : string
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
  kgID? : string
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
  mouseOverLandmark : any 
  focusedSidePanel : string | null
}

export interface UIAction extends Action{
  segment : any | number
  landmark : any
  focusedSidePanel? : string
}

export interface Landmark{
  type : string //e.g. sEEG recording site, etc
  name : string
  templateSpace : string // possibily inherited from LandmarkBundle (?)
  geometry : PointLandmarkGeometry | PlaneLandmarkGeometry | OtherLandmarkGeometry
  properties : Property
  files : File[]
}

export interface LandmarkGeometry{
  type : 'point' | 'plane'
  space? : 'voxel' | 'real'
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

export function isDefined(obj){
  return typeof obj !== 'undefined' && obj !== null
}