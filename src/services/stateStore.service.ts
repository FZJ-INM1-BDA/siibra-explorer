import { filter } from 'rxjs/operators';

export { viewerConfigState } from './state/viewerConfig.store'
export { pluginState } from './state/pluginState.store'
export { NgViewerAction, NgViewerStateInterface, ngViewerState, ADD_NG_LAYER, FORCE_SHOW_SEGMENT, HIDE_NG_LAYER, REMOVE_NG_LAYER, SHOW_NG_LAYER } from './state/ngViewerState.store'
export { CHANGE_NAVIGATION, AtlasAction, DESELECT_LANDMARKS, FETCHED_TEMPLATE, NEWVIEWER, SELECT_LANDMARKS, SELECT_PARCELLATION, SELECT_REGIONS, USER_LANDMARKS, ViewerStateInterface, viewerState } from './state/viewerState.store'
export { DataEntry, ParcellationRegion, DataStateInterface, DatasetAction, FETCHED_DATAENTRIES, FETCHED_METADATA, FETCHED_SPATIAL_DATA, Landmark, OtherLandmarkGeometry, PlaneLandmarkGeometry, PointLandmarkGeometry, Property, Publication, ReferenceSpace, dataStore, File, FileSupplementData } from './state/dataStore.store'
export { CLOSE_SIDE_PANEL, MOUSE_OVER_LANDMARK, MOUSE_OVER_SEGMENT, OPEN_SIDE_PANEL, TOGGLE_SIDE_PANEL, UIAction, UIStateInterface, uiState } from './state/uiState.store'
export { SPATIAL_GOTO_PAGE, SpatialDataEntries, SpatialDataStateInterface, UPDATE_SPATIAL_DATA, spatialSearchState } from './state/spatialSearchState.store'

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

const inheritNgId = (region:any) => {
  const {ngId = 'root', children = []} = region
  return {
    ngId,
    ...region,
    ...(children && children.map
      ? {
        children: children.map(c => inheritNgId({
          ngId,
          ...c
        }))
      }
      : {})
  }
}

export function getMultiNgIdsRegionsLabelIndexMap(parcellation: any = {}):Map<string,Map<number, any>>{
  const map:Map<string,Map<number, any>> = new Map()
  const { ngId = 'root'} = parcellation

  const processRegion = (region:any) => {
    const { ngId } = region
    const existingMap = map.get(ngId)
    const labelIndex = Number(region.labelIndex)
    if (labelIndex) {
      if (!existingMap) {
        const newMap = new Map()
        newMap.set(labelIndex, region)
        map.set(ngId, newMap)
      } else {
        existingMap.set(labelIndex, region)
      }
    }

    if (region.children && region.children.forEach) {
      region.children.forEach(child => {
        processRegion({
          ngId,
          ...child
        })
      })
    }
  }

  if (parcellation && parcellation.regions && parcellation.regions.forEach) {
    parcellation.regions.forEach(r => processRegion({
      ngId,
      ...r
    }))
  }

  return map
}

/**
 * labelIndexMap maps label index to region
 */
export function getLabelIndexMap(regions:any[]):Map<number,any>{
  const returnMap = new Map()

  const reduceRegions = (regions:any[]) => {
    regions.forEach(region=>{
      if( region.labelIndex ) returnMap.set(Number(region.labelIndex),
        Object.assign({},region,{labelIndex : Number(region.labelIndex)}))
      if( region.children && region.children.constructor === Array ) reduceRegions(region.children)
    })
  }

  if (regions && regions.forEach) reduceRegions(regions)
  return returnMap
}

/**
 * 
 * @param regions regions to deep iterate to find all ngId 's, filtering out falsy values
 * n.b. returns non unique list
 */
export function getNgIds(regions: any[]): string[]{
  return regions && regions.map
    ? regions
        .map(r => [r.ngId, ...getNgIds(r.children)])
        .reduce((acc, item) => acc.concat(item), [])
        .filter(ngId => !!ngId)
    : []
}

export interface DedicatedViewState{
  dedicatedView : string | null
}

export function isDefined(obj){
  return typeof obj !== 'undefined' && obj !== null
}

export function generateLabelIndexId({ ngId, labelIndex }) {
  return `${ngId}#${labelIndex}`
}

export function getNgIdLabelIndexFromId({ labelIndexId } = {labelIndexId: ''}) {
  const _ = labelIndexId && labelIndexId.split && labelIndexId.split('#') || []
  const ngId = _.length > 1
    ? _[0]
    : null
  const labelIndex = _.length > 1
    ? Number(_[1])
    : _.length === 0
      ? null
      : Number(_[0])
  return { ngId, labelIndex }
}

const recursiveFlatten = (region, {ngId}) => {
  return [{
    ngId,
    ...region
  }].concat(
    ...((region.children && region.children.map && region.children.map(c => recursiveFlatten(c, { ngId : region.ngId || ngId })) )|| [])
  )
}

export function recursiveFindRegionWithLabelIndexId({ regions, labelIndexId, inheritedNgId = 'root' }: {regions: any[], labelIndexId: string, inheritedNgId:string}) {
  const { ngId, labelIndex } = getNgIdLabelIndexFromId({ labelIndexId })
  const fr1 = regions.map(r => recursiveFlatten(r,{ ngId: inheritedNgId }))
  const fr2 = fr1.reduce((acc, curr) => acc.concat(...curr), [])
  const found = fr2.find(r => r.ngId === ngId && Number(r.labelIndex) === Number(labelIndex))
  if (found) return found
  debugger
  return null
}
