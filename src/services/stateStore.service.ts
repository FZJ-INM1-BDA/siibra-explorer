import { filter } from 'rxjs/operators';

import {
  StateInterface as PluginStateInterface,
  stateStore as pluginState,
  defaultState as pluginDefaultState,
  getStateStore as pluginGetStateStore
} from './state/pluginState.store'
import {
  StateInterface as ViewerConfigStateInterface,
  stateStore as viewerConfigState,
  defaultState as viewerConfigDefaultState,
  getStateStore as getViewerConfigStateStore
} from './state/viewerConfig.store'
import {
  StateInterface as NgViewerStateInterface,
  ActionInterface as NgViewerActionInterface,
  stateStore as ngViewerState,
  defaultState as ngViewerDefaultState,
  getStateStore as getNgViewerStateStore
} from './state/ngViewerState.store'
import {
  StateInterface as ViewerStateInterface,
  ActionInterface as ViewerActionInterface,
  stateStore as viewerState,
  defaultState as viewerDefaultState,
  getStateStore as getViewerStateStore
} from './state/viewerState.store'
import {
  StateInterface as DataStateInterface,
  ActionInterface as DatasetAction,
  stateStore as dataStore,
  defaultState as dataStoreDefaultState,
  getStateStore as getDatasetStateStore
} from './state/dataStore.store'
import {
  StateInterface as UIStateInterface,
  ActionInterface as UIActionInterface,
  stateStore as uiState,
  defaultState as uiDefaultState,
  getStateStore as getUiStateStore
} from './state/uiState.store'
import{
  stateStore as userConfigState,
  ACTION_TYPES as USER_CONFIG_ACTION_TYPES,
  StateInterface as UserConfigStateInterface,
  defaultState as userConfigDefaultState,
  getStateStore as getuserConfigStateStore
} from './state/userConfigState.store'
import { cvtSearchParamToState } from 'src/atlasViewer/atlasViewer.urlUtil';

export { pluginState }
export { viewerConfigState }
export { NgViewerStateInterface, NgViewerActionInterface, ngViewerState }
export { ViewerStateInterface, ViewerActionInterface, viewerState }
export { DataStateInterface, DatasetAction, dataStore }
export { UIStateInterface, UIActionInterface, uiState }
export { userConfigState,  USER_CONFIG_ACTION_TYPES}

export { ADD_NG_LAYER, FORCE_SHOW_SEGMENT, HIDE_NG_LAYER, REMOVE_NG_LAYER, SHOW_NG_LAYER } from './state/ngViewerState.store'
export { CHANGE_NAVIGATION, DESELECT_LANDMARKS, FETCHED_TEMPLATE, NEWVIEWER, SELECT_LANDMARKS, SELECT_PARCELLATION, SELECT_REGIONS, USER_LANDMARKS } from './state/viewerState.store'
export { DataEntry, ParcellationRegion, FETCHED_DATAENTRIES, FETCHED_SPATIAL_DATA, Landmark, OtherLandmarkGeometry, PlaneLandmarkGeometry, PointLandmarkGeometry, Property, Publication, ReferenceSpace, File, FileSupplementData } from './state/dataStore.store'
export { CLOSE_SIDE_PANEL, MOUSE_OVER_LANDMARK, MOUSE_OVER_SEGMENT, OPEN_SIDE_PANEL, SHOW_SIDE_PANEL_CONNECTIVITY, HIDE_SIDE_PANEL_CONNECTIVITY, COLLAPSE_SIDE_PANEL_CURRENT_VIEW, EXPAND_SIDE_PANEL_CURRENT_VIEW } from './state/uiState.store'
export { UserConfigStateUseEffect } from './state/userConfigState.store'

export const GENERAL_ACTION_TYPES = {
  ERROR: 'ERROR',
  APPLY_STATE: 'APPLY_STATE'
}

// TODO deprecate
export function safeFilter(key:string){
  return filter((state:any)=>
    (typeof state !== 'undefined' && state !== null) &&
    typeof state[key] !== 'undefined' && state[key] !== null) 
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

export function getNgIdLabelIndexFromRegion({ region }){
  const { ngId, labelIndex } = region
  if (ngId && labelIndex) return { ngId, labelIndex }
  throw new Error(`ngId: ${ngId} or labelIndex: ${labelIndex} not defined`)
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
 * @TODO deprecate
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


// @TODO deprecate
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
  return null
}

export interface IavRootStoreInterface{
  pluginState: PluginStateInterface
  viewerConfigState: ViewerConfigStateInterface
  ngViewerState: NgViewerStateInterface
  viewerState: ViewerStateInterface
  dataStore: DataStateInterface
  uiState: UIStateInterface
  userConfigState: UserConfigStateInterface
}

export const defaultRootState: IavRootStoreInterface = {
  pluginState: pluginDefaultState,
  dataStore: dataStoreDefaultState,
  ngViewerState: ngViewerDefaultState,
  uiState: uiDefaultState,
  userConfigState: userConfigDefaultState,
  viewerConfigState: viewerConfigDefaultState,
  viewerState: viewerDefaultState
}


// export const getInitialState = (): IavRootStoreInterface => {
//   const search = new URLSearchParams( window.location.search )
//   cvtSearchParamToState(search, defaultRootState)
// }