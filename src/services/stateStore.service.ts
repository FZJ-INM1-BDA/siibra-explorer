import { filter } from 'rxjs/operators';

export { getNgIds } from 'src/util/fn'

import {
  ActionInterface as NgViewerActionInterface,
  defaultState as ngViewerDefaultState,
  StateInterface as NgViewerStateInterface,
  stateStore as ngViewerState,
} from './state/ngViewerState.store'
import {
  defaultState as pluginDefaultState,
  StateInterface as PluginStateInterface,
  stateStore as pluginState,
} from './state/pluginState.store'
import {
  ActionInterface as UIActionInterface,
  defaultState as uiDefaultState,
  StateInterface as UIStateInterface,
  stateStore as uiState,
} from './state/uiState.store'
import {
  ACTION_TYPES as USER_CONFIG_ACTION_TYPES,
  defaultState as userConfigDefaultState,
  StateInterface as UserConfigStateInterface,
  stateStore as userConfigState,
} from './state/userConfigState.store'
import {
  defaultState as viewerConfigDefaultState,
  StateInterface as ViewerConfigStateInterface,
  stateStore as viewerConfigState,
} from './state/viewerConfig.store'
import {
  ActionInterface as ViewerActionInterface,
  defaultState as viewerDefaultState,
  StateInterface as ViewerStateInterface,
  stateStore as viewerState,
} from './state/viewerState.store'

import { 
  defaultState as defaultViewerHelperState,
  viewerStateHelperStoreName
} from './state/viewerState.store.helper'

export { pluginState }
export { viewerConfigState }
export { NgViewerStateInterface, NgViewerActionInterface, ngViewerState }
export { ViewerStateInterface, ViewerActionInterface, viewerState }
export { UIStateInterface, UIActionInterface, uiState }
export { userConfigState,  USER_CONFIG_ACTION_TYPES}

export { CHANGE_NAVIGATION, DESELECT_LANDMARKS, FETCHED_TEMPLATE, NEWVIEWER, SELECT_LANDMARKS, SELECT_PARCELLATION, SELECT_REGIONS, USER_LANDMARKS } from './state/viewerState.store'
export { IDataEntry, IParcellationRegion, FETCHED_DATAENTRIES, FETCHED_SPATIAL_DATA, ILandmark, IOtherLandmarkGeometry, IPlaneLandmarkGeometry, IPointLandmarkGeometry, IProperty, IPublication, IReferenceSpace, IFile, IFileSupplementData } from './state/dataStore.store'
export { CLOSE_SIDE_PANEL, MOUSE_OVER_LANDMARK, MOUSE_OVER_SEGMENT, OPEN_SIDE_PANEL, COLLAPSE_SIDE_PANEL_CURRENT_VIEW, EXPAND_SIDE_PANEL_CURRENT_VIEW } from './state/uiState.store'
export { UserConfigStateUseEffect } from './state/userConfigState.store'

export { GENERAL_ACTION_TYPES } from './stateStore.helper'

// TODO deprecate
export function safeFilter(key: string) {
  return filter((state: any) =>
    (typeof state !== 'undefined' && state !== null) &&
    typeof state[key] !== 'undefined' && state[key] !== null)
}

export function getNgIdLabelIndexFromRegion({ region }) {
  const { ngId, labelIndex } = region
  if (ngId && labelIndex) { return { ngId, labelIndex } }
  throw new Error(`ngId: ${ngId} or labelIndex: ${labelIndex} not defined`)
}

export function getMultiNgIdsRegionsLabelIndexMap(parcellation: any = {}, inheritAttrsOpt: any = { ngId: 'root' }): Map<string, Map<number, any>> {
  const map: Map<string, Map<number, any>> = new Map()
  
  const inheritAttrs = Object.keys(inheritAttrsOpt)
  if (inheritAttrs.indexOf('children') >=0 ) throw new Error(`children attr cannot be inherited`)

  const processRegion = (region: any) => {
    const { ngId: rNgId } = region
    const existingMap = map.get(rNgId)
    const labelIndex = Number(region.labelIndex)
    if (labelIndex) {
      if (!existingMap) {
        const newMap = new Map()
        newMap.set(labelIndex, region)
        map.set(rNgId, newMap)
      } else {
        existingMap.set(labelIndex, region)
      }
    }

    if (region.children && Array.isArray(region.children)) {
      for (const r of region.children) {
        const copiedRegion = { ...r }
        for (const attr of inheritAttrs){
          copiedRegion[attr] = copiedRegion[attr] || region[attr] || parcellation[attr]
        }
        processRegion(copiedRegion)
      }
    }
  }

  if (!parcellation) throw new Error(`parcellation needs to be defined`)
  if (!parcellation.regions) throw new Error(`parcellation.regions needs to be defined`)
  if (!Array.isArray(parcellation.regions)) throw new Error(`parcellation.regions needs to be an array`)

  for (const region of parcellation.regions){
    const copiedregion = { ...region }
    for (const attr of inheritAttrs){
      copiedregion[attr] = copiedregion[attr] || parcellation[attr]
    }
    processRegion(copiedregion)
  }

  return map
}

/**
 * labelIndexMap maps label index to region
 * @TODO deprecate
 */
export function getLabelIndexMap(regions: any[]): Map<number, any> {
  const returnMap = new Map()

  const reduceRegions = (rs: any[]) => {
    rs.forEach(region => {
      if ( region.labelIndex ) { returnMap.set(Number(region.labelIndex),
        Object.assign({}, region, {labelIndex : Number(region.labelIndex)}))
      }
      if ( region.children && region.children.constructor === Array ) { reduceRegions(region.children) }
    })
  }

  if (regions && regions.forEach) { reduceRegions(regions) }
  return returnMap
}

/**
 *
 * @param regions regions to deep iterate to find all ngId 's, filtering out falsy values
 * n.b. returns non unique list
 */
export interface DedicatedViewState {
  dedicatedView: string | null
}

// @TODO deprecate
export function isDefined(obj) {
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
    ...region,
  }].concat(
    ...((region.children && region.children.map && region.children.map(c => recursiveFlatten(c, { ngId : region.ngId || ngId })) ) || []),
  )
}

export function recursiveFindRegionWithLabelIndexId({ regions, labelIndexId, inheritedNgId = 'root' }: {regions: any[], labelIndexId: string, inheritedNgId: string}) {
  const { ngId, labelIndex } = getNgIdLabelIndexFromId({ labelIndexId })
  const fr1 = regions.map(r => recursiveFlatten(r, { ngId: inheritedNgId }))
  const fr2 = fr1.reduce((acc, curr) => acc.concat(...curr), [])
  const found = fr2.find(r => r.ngId === ngId && Number(r.labelIndex) === Number(labelIndex))
  if (found) { return found }
  return null
}

export interface IavRootStoreInterface {
  pluginState: PluginStateInterface
  viewerConfigState: ViewerConfigStateInterface
  ngViewerState: NgViewerStateInterface
  viewerState: ViewerStateInterface
  dataStore: any
  uiState: UIStateInterface
  userConfigState: UserConfigStateInterface
}

import { DATASTORE_DEFAULT_STATE } from 'src/ui/databrowserModule'

export const defaultRootState: any = {
  pluginState: pluginDefaultState,
  dataStore: DATASTORE_DEFAULT_STATE,
  ngViewerState: ngViewerDefaultState,
  uiState: uiDefaultState,
  userConfigState: userConfigDefaultState,
  viewerConfigState: viewerConfigDefaultState,
  viewerState: viewerDefaultState,
  [viewerStateHelperStoreName]: defaultViewerHelperState
}
