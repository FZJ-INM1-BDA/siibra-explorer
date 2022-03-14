import { encodeNumber, decodeToNumber, separator, encodeURIFull } from './cipher'
import { UrlSegment, UrlTree } from "@angular/router"
import { Component } from "@angular/core"
import { atlasSelection, plugins } from "src/state"

import {
  TUrlStandaloneVolume,
  TUrlAtlas,
  TUrlPathObj,
} from './type'

import {
  parseSearchParamForTemplateParcellationRegion,
  encodeId,
} from './parseRouteToTmplParcReg'
import { spaceMiscInfoMap } from "src/util/pureConstant.service"
import { getRegionLabelIndex, getParcNgId } from "src/viewerModule/nehuba/config.service"

const endcodePath = (key: string, val: string|string[]) =>
  key[0] === '?'
    ? `?${key}=${val}`
    : `${key}:${Array.isArray(val)
      ? val.map(v => encodeURI(v)).join('::')
      : encodeURI(val)}`
const decodePath = (path: string) => {
  const re = /^(.*?):(.*?)$/.exec(path)
  if (!re) return null
  return {
    key: re[1],
    val: re[2].split('::').map(v => decodeURI(v))
  }
}

export const DEFAULT_NAV = {
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [
    0.3140767216682434,
    -0.7418519854545593,
    0.4988985061645508,
    -0.3195493221282959
  ],
  position: [0, 0, 0],
}

export const cvtFullRouteToState = (fullPath: UrlTree, state: any, _warnCb?: (arg: string) => void) => {

  const warnCb = _warnCb || ((...e: any[]) => console.warn(...e))
  const pathFragments: UrlSegment[] = fullPath.root.hasChildren()
    ? fullPath.root.children['primary'].segments
    : []

  const returnState = JSON.parse(JSON.stringify(state))

  const returnObj: Partial<TUrlPathObj<string[], unknown>> = {}
  for (const f of pathFragments) {
    const { key, val } = decodePath(f.path) || {}
    if (!key || !val) continue
    returnObj[key] = val
  }

  // logical assignment. Use instead of above after typescript > v4.0.0
  // returnState['viewerState'] ||= {}
  if (!returnState['viewerState']) {
    returnState['viewerState'] = {}
  }
  // -- end fix logical assignment

  // nav obj is almost always defined, regardless if standaloneVolume or not
  const cViewerState = returnObj['@'] && returnObj['@'][0]
  let parsedNavObj: any
  if (cViewerState) {
    try {
      const [ cO, cPO, cPZ, cP, cZ ] = cViewerState.split(`${separator}${separator}`)
      const o = cO.split(separator).map(s => decodeToNumber(s, {float: true}))
      const po = cPO.split(separator).map(s => decodeToNumber(s, {float: true}))
      const pz = decodeToNumber(cPZ)
      const p = cP.split(separator).map(s => decodeToNumber(s))
      const z = decodeToNumber(cZ)
      parsedNavObj = {
        orientation: o,
        perspectiveOrientation: po,
        perspectiveZoom: pz,
        position: p,
        zoom: z,

        // flag to allow for animation when enabled
        animation: {},
      }
    } catch (e) {
      /**
       * TODO Poisoned encoded char
       * send error message
       */
      warnCb(`parse nav error`, e)
    }
  }

  // pluginState should always be defined, regardless if standalone volume or not
  const pluginStates = fullPath.queryParams['pl']
  const { pluginState } = returnState
  if (pluginStates) {
    try {
      const arrPluginStates = JSON.parse(pluginStates)
      pluginState.initManifests = arrPluginStates.map(url => [plugins.INIT_MANIFEST_SRC, url] as [string, string])
    } catch (e) {
      /**
       * parsing plugin error
       */
      warnCb(`parse plugin states error`, e, pluginStates)
    }
  }

  // preview dataset can and should be displayed regardless of standalone volume or not

  try {
    const { uiState } = returnState
    const arr = returnObj.dsp
      ? [{
        datasetId: returnObj.dsp[0],
        filename: returnObj.dsp[1]
      }]
      : fullPath.queryParams['previewingDatasetFiles'] && JSON.parse(fullPath.queryParams['previewingDatasetFiles'])
    if (arr) {
      uiState.previewingDatasetFiles = arr.map(({ datasetId, filename }) => {
        return {
          datasetId,
          filename
        }
      })
    }
  } catch (e) {
    // parsing previewingDatasetFiles
    warnCb(`parse dsp error`, e)
  }

  // If sv (standaloneVolume is defined)
  // only load sv in state
  // ignore all other params
  // /#/sv:%5B%22precomputed%3A%2F%2Fhttps%3A%2F%2Fobject.cscs.ch%2Fv1%2FAUTH_08c08f9f119744cbbf77e216988da3eb%2Fimgsvc-46d9d64f-bdac-418e-a41b-b7f805068c64%22%5D
  const standaloneVolumes = fullPath.queryParams['standaloneVolumes']
  if (!!standaloneVolumes) {
    try {
      const parsedArr = JSON.parse(standaloneVolumes)
      if (!Array.isArray(parsedArr)) throw new Error(`Parsed standalone volumes not of type array`)

      returnState['viewerState']['standaloneVolumes'] = parsedArr
      returnState['viewerState']['navigation'] = parsedNavObj
      return returnState
    } catch (e) {
      // if any error occurs, parse rest per normal
      warnCb(`parse standalone volume error`, e)
    }
  } else {
    returnState['viewerState']['standaloneVolumes'] = []
  }

  try {
    const { parcellationSelected, regionsSelected, templateSelected } = parseSearchParamForTemplateParcellationRegion(returnObj as TUrlPathObj<string[], TUrlAtlas<string[]>>, fullPath, state, warnCb)
    returnState['viewerState']['parcellationSelected'] = parcellationSelected
    returnState['viewerState']['regionsSelected'] = regionsSelected
    returnState['viewerState']['templateSelected'] = templateSelected

    if (templateSelected) {
      const { scale } = spaceMiscInfoMap.get(templateSelected.id) || { scale: 1 }
      returnState['viewerState']['navigation'] = parsedNavObj || ({
        ...DEFAULT_NAV,
        zoom: 350000 * scale,
        perspectiveZoom: 1922235.5293810747 * scale
      })
    }
  } catch (e) {
    // if error, show error on UI?
    warnCb(`parse template, parc, region error`, e)
  }

  /**
   * parsing template to get atlasId
   */
  // TODO
  return returnState
}

export const cvtStateToHashedRoutes = (state): string => {
  // TODO check if this causes memleak
  const {
    atlas: selectedAtlas,
    parcellation: selectedParcellation,
    template: selectedTemplate,
  } = atlasSelection.selectors.selectedATP(state)
  
  const selectedRegions = atlasSelection.selectors.selectedRegions(state)
  const standaloneVolumes = atlasSelection.selectors.standaloneVolumes(state)
  const navigation = atlasSelection.selectors.navigation(state)

  let dsPrvString: string
  const searchParam = new URLSearchParams()

  let cNavString: string
  if (navigation) {
    const { orientation, perspectiveOrientation, perspectiveZoom, position, zoom } = navigation
    if (orientation && perspectiveOrientation && perspectiveZoom && position && zoom) {
      cNavString = [
        orientation.map((n: number) => encodeNumber(n, {float: true})).join(separator),
        perspectiveOrientation.map(n => encodeNumber(n, {float: true})).join(separator),
        encodeNumber(Math.floor(perspectiveZoom)),
        Array.from(position).map((v: number) => Math.floor(v)).map(n => encodeNumber(n)).join(separator),
        encodeNumber(Math.floor(zoom)),
      ].join(`${separator}${separator}`)
    }
  }

  // encoding selected regions
  let selectedRegionsString: string
  if (selectedRegions.length === 1) {
    const region = selectedRegions[0]
    const labelIndex = getRegionLabelIndex(selectedAtlas, selectedTemplate, selectedParcellation, region)
    
    const ngId = getParcNgId(selectedAtlas, selectedTemplate, selectedParcellation, region)
    selectedRegionsString = `${ngId}::${encodeNumber(labelIndex, { float: false })}`
  }
  let routes: any
  
  routes= {
    // for atlas
    a: selectedAtlas && encodeId(selectedAtlas['@id']),
    // for template
    t: selectedTemplate && encodeId(selectedTemplate['@id'] || selectedTemplate['fullId']),
    // for parcellation
    p: selectedParcellation && encodeId(selectedParcellation['@id'] || selectedParcellation['fullId']),
    // for regions
    r: selectedRegionsString && encodeURIFull(selectedRegionsString),
    // nav
    ['@']: cNavString,
    // dataset file preview
    dsp: dsPrvString && encodeURI(dsPrvString),
  } as TUrlPathObj<string, TUrlAtlas<string>>

  /**
   * if any params needs to overwrite previosu routes, put them here
   */
  if (standaloneVolumes && Array.isArray(standaloneVolumes) && standaloneVolumes.length > 0) {
    searchParam.set('standaloneVolumes', JSON.stringify(standaloneVolumes))
    routes = {
      // nav
      ['@']: cNavString,
      dsp: dsPrvString && encodeURI(dsPrvString)
    } as TUrlPathObj<string|string[], TUrlStandaloneVolume<string[]>>
  }

  const routesArr: string[] = []
  for (const key in routes) {
    if (!!routes[key]) {
      const segStr = endcodePath(key, routes[key])
      routesArr.push(segStr)
    }
  }

  return searchParam.toString() === '' 
    ? routesArr.join('/')
    : `${routesArr.join('/')}?${searchParam.toString()}`
}

export const verifyCustomState = (key: string) => {
  return /^x-/.test(key)
}

export const decodeCustomState = (fullPath: UrlTree) => {
  const returnObj: Record<string, string> = {}
  
  const pathFragments: UrlSegment[] = fullPath.root.hasChildren()
    ? fullPath.root.children['primary'].segments
    : []
  
  for (const f of pathFragments) {
    if (!verifyCustomState(f.path)) continue
    const { key, val } = decodePath(f.path) || {}
    if (!key || !val) continue
    returnObj[key] = val[0]
  }
  return returnObj
}

export const encodeCustomState = (key: string, value: string) => {
  if (!verifyCustomState(key)) {
    throw new Error(`custom state must start with x-`)
  }
  if (!value) return null
  return endcodePath(key, value)
}

@Component({
  template: ''
})
export class DummyCmp{}

export const routes = [{
  path: '**',
  component: DummyCmp
}]
