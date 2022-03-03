import { filter } from 'rxjs/operators';

export { getNgIds } from 'src/util/fn'

import {
  ActionInterface as NgViewerActionInterface,
  defaultState as ngViewerDefaultState,
  StateInterface as NgViewerStateInterface,
  stateStore as ngViewerState,
} from './state/ngViewerState.store'
import {
  ActionInterface as UIActionInterface,
  defaultState as uiDefaultState,
  IUiState,
  stateStore as uiState,
} from './state/uiState.store'
import {
  ACTION_TYPES as USER_CONFIG_ACTION_TYPES,
  defaultState as userConfigDefaultState,
  StateInterface as UserConfigStateInterface,
  userConfigReducer as userConfigState,
} from './state/userConfigState.store'
import {
  defaultState as viewerConfigDefaultState,
  StateInterface as ViewerConfigStateInterface,
  stateStore as viewerConfigState,
} from './state/viewerConfig.store'


export { viewerConfigState }
export { NgViewerStateInterface, NgViewerActionInterface, ngViewerState }
export { IUiState, UIActionInterface, uiState }
export { userConfigState,  USER_CONFIG_ACTION_TYPES}

export { MOUSE_OVER_SEGMENT, OPEN_SIDE_PANEL, COLLAPSE_SIDE_PANEL_CURRENT_VIEW, EXPAND_SIDE_PANEL_CURRENT_VIEW } from './state/uiState.store'
export { UserConfigStateUseEffect } from './state/userConfigState.store'

export { GENERAL_ACTION_TYPES, generalActionError } from './stateStore.helper'

// TODO deprecate
export function safeFilter(key: string) {
  return filter((state: any) =>
    (typeof state !== 'undefined' && state !== null) &&
    typeof state[key] !== 'undefined' && state[key] !== null)
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


// @TODO deprecate
export function isDefined(obj) {
  return typeof obj !== 'undefined' && obj !== null
}

export interface IavRootStoreInterface {
  viewerConfigState: ViewerConfigStateInterface
  ngViewerState: NgViewerStateInterface
  uiState: IUiState
  userConfigState: UserConfigStateInterface
}

export const defaultRootState: any = {
  ngViewerState: ngViewerDefaultState,
  uiState: uiDefaultState,
  userConfigState: userConfigDefaultState,
  viewerConfigState: viewerConfigDefaultState,
}
