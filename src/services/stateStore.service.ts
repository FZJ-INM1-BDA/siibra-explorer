import { filter } from 'rxjs/operators';

export { viewerConfigState } from './state/viewerConfig.store'
export { pluginState } from './state/pluginState.store'
export { NgViewerAction, NgViewerStateInterface, ngViewerState, ADD_NG_LAYER, FORCE_SHOW_SEGMENT, HIDE_NG_LAYER, REMOVE_NG_LAYER, SHOW_NG_LAYER } from './state/ngViewerState.store'
export { CHANGE_NAVIGATION, AtlasAction, DESELECT_LANDMARKS, DESELECT_REGIONS, FETCHED_TEMPLATE, NEWVIEWER, SELECT_LANDMARKS, SELECT_PARCELLATION, SELECT_REGIONS, USER_LANDMARKS, ViewerStateInterface, viewerState } from './state/viewerState.store'
export { DataEntry, ParcellationRegion, DataStateInterface, DatasetAction, FETCHED_DATAENTRIES, FETCHED_METADATA, FETCHED_SPATIAL_DATA, Landmark, OtherLandmarkGeometry, PlaneLandmarkGeometry, PointLandmarkGeometry, Property, Publication, ReferenceSpace, dataStore, File, FileSupplementData } from './state/dataStore.store'
export { CLOSE_SIDE_PANEL, MOUSE_OVER_LANDMARK, MOUSE_OVER_SEGMENT, OPEN_SIDE_PANEL, TOGGLE_SIDE_PANEL, UIAction, UIStateInterface, uiState } from './state/uiState.store'
export { SPATIAL_GOTO_PAGE, SpatialDataEntries, SpatialDataStateInterface, UPDATE_SPATIAL_DATA, UPDATE_SPATIAL_DATA_VISIBLE, spatialSearchState } from './state/spatialSearchState.store'

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

export function isDefined(obj){
  return typeof obj !== 'undefined' && obj !== null
}
