import { viewerStateGetSelectedAtlas, viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector, viewerStateSelectorNavigation, viewerStateSelectorStandaloneVolumes } from "src/services/state/viewerState/selectors"
import { encodeNumber, decodeToNumber, separator } from './cipher'
import { getGetRegionFromLabelIndexId } from 'src/util/fn'
import { serialiseParcellationRegion } from "common/util"
import { UrlSegment, UrlTree } from "@angular/router"
import { getShader, PMAP_DEFAULT_CONFIG } from "src/util/constants"
import { mixNgLayers } from "src/services/state/ngViewerState.store"
import { PLUGINSTORE_CONSTANTS } from 'src/services/state/pluginState.store'
import { viewerStateHelperStoreName } from "src/services/state/viewerState.store.helper"
import { uiStatePreviewingDatasetFilesSelector } from "src/services/state/uiState/selectors"
import { Component } from "@angular/core"

export const PARSE_ERROR = {
  TEMPALTE_NOT_SET: 'TEMPALTE_NOT_SET',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  PARCELLATION_NOT_UPDATED: 'PARCELLATION_NOT_UPDATED',
}

const encodeId = (id: string) => id && id.replace(/\//g, ':')
const decodeId = (codedId: string) => codedId && codedId.replace(/:/g, '/')
const endcodePath = (key: string, val: string) => `${key}:${encodeURI(val)}`
const decodePath = (path: string) => {
  const re = /^(.*?):(.*?)$/.exec(path)
  if (!re) return null
  return {
    key: re[1],
    val: re[2].split('::').map(v => decodeURI(v))
  }
}

type TUrlStandaloneVolume<T> = {
  sv: T // standalone volume
}

type TUrlAtlas<T> = {
  a: T   // atlas
  t: T   // template
  p: T   // parcellation
  r?: T  // region selected
}

type TUrlPreviewDs<T> = {
  dsp: T // dataset preview
}

type TUrlPlugin<T> = {
  pl: T  // pluginState
}

type TUrlNav<T> = {
  ['@']: T // navstring
}

type TConditional<T> = Partial<
  TUrlPreviewDs<T> &
  TUrlPlugin<T> &
  TUrlNav<T>
>

type TUrlPathObj<T, V> =  (V extends TUrlStandaloneVolume<T> ? TUrlStandaloneVolume<T> : TUrlAtlas<T>) & TConditional<T>

function parseSearchParamForTemplateParcellationRegion(obj: TUrlPathObj<string[], TUrlAtlas<string[]>>, fullPath: UrlTree, state: any, warnCb: Function) {

  /**
   * TODO if search param of either template or parcellation is incorrect, wrong things are searched
   */
  

  const templateSelected = (() => {
    const { fetchedTemplates } = state.viewerState

    const searchedId = obj.t && decodeId(obj.t[0])

    if (!searchedId) return null
    const templateToLoad = fetchedTemplates.find(template => (template['@id'] || template['fullId']) === searchedId)
    if (!templateToLoad) { throw new Error(PARSE_ERROR.TEMPLATE_NOT_FOUND) }
    return templateToLoad
  })()

  const parcellationSelected = (() => {
    if (!templateSelected) return null
    const searchedId = obj.p && decodeId(obj.p[0])

    const parcellationToLoad = templateSelected.parcellations.find(parcellation => (parcellation['@id'] || parcellation['fullId']) === searchedId)
    if (!parcellationToLoad) { 
      warnCb(`parcellation with id ${searchedId} not found... load the first parc instead`)
    }
    return parcellationToLoad || templateSelected.parcellations[0]
  })()

  /* selected regions */

  const regionsSelected = (() => {
    if (!parcellationSelected) return []

    // TODO deprecate. Fallback (defaultNgId) (should) already exist
    // if (!viewerState.parcellationSelected.updated) throw new Error(PARCELLATION_NOT_UPDATED)

    const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({ parcellation: parcellationSelected })
    /**
     * either or both parcellationToLoad and .regions maybe empty
     */

    try {
      const json = obj.r
        ? { [obj.r[0]] : obj.r[1] }
        : JSON.parse(fullPath.queryParams['cRegionsSelected'] || '{}')

      const selectRegionIds = []

      for (const ngId in json) {
        const val = json[ngId]
        const labelIndicies = val.split(separator).map(n => {
          try {
            return decodeToNumber(n)
          } catch (e) {
            /**
             * TODO poisonsed encoded char, send error message
             */
            return null
          }
        }).filter(v => !!v)
        for (const labelIndex of labelIndicies) {
          selectRegionIds.push( serialiseParcellationRegion({ ngId, labelIndex }) )
        }
      }
      return selectRegionIds
        .map(labelIndexId => {
          const region = getRegionFromlabelIndexId({ labelIndexId })
          if (!region) {
            // cb && cb({ type: ID_ERROR, message: `region with id ${labelIndexId} not found, and will be ignored.` })
          }
          return region
        })
        .filter(r => !!r)

    } catch (e) {
      /**
       * parsing cRegionSelected error
       */
      // cb && cb({ type: DECODE_CIPHER_ERROR, message: `parsing cRegionSelected error ${e.toString()}` })
    }
    return []
  })()

  return {
    templateSelected,
    parcellationSelected,
    regionsSelected,
  }
}

export const cvtFullRouteToState = (fullPath: UrlTree, state: any, _warnCb?: Function) => {

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

  // TODO deprecate
  // but ensure bkwd compat?
  const niftiLayers = fullPath.queryParams['niftiLayers']
  if (niftiLayers) {
    const layers = niftiLayers
      .split('__')
      .map(layer => {
        return {
          name : layer,
          source : `nifti://${layer}`,
          mixability : 'nonmixable',
          shader : getShader(PMAP_DEFAULT_CONFIG),
        } as any
      })
    const { ngViewerState } = returnState
    ngViewerState.layers = mixNgLayers(ngViewerState.layers, layers)
  }
  // -- end deprecate

  // logical assignment. Use instead of above after typescript > v4.0.0
  // returnState['viewerState'] ||= {}
  if (!returnState['viewerState']) {
    returnState['viewerState'] = {}
  }
  // -- end fix logical assignment

  // nav obj is almost always defined, regardless if standaloneVolume or not
  const cViewerState = returnObj['@'] && returnObj['@'][0]
  let parsedNavObj = {}
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
      pluginState.initManifests = arrPluginStates.map(url => [PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC, url] as [string, string])
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
  if (!!returnObj['sv']) {
    try {
      const parsedArr = JSON.parse(returnObj['sv'])
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

    returnState['viewerState']['navigation'] = parsedNavObj
  } catch (e) {
    // if error, show error on UI?
    warnCb(`parse template, parc, region error`, e)
  }

  /**
   * parsing template to get atlasId
   */
  (() => {

    const viewreHelperState = returnState[viewerStateHelperStoreName] || {}
    const { templateSelected, parcellationSelected } = returnState['viewerState']
    const { fetchedAtlases, ...rest } = viewreHelperState
    
    const selectedAtlas = (fetchedAtlases || []).find(a => a['templateSpaces'].find(t => t['@id'] === (templateSelected && templateSelected['@id'])))
    
    const overlayLayer = selectedAtlas && selectedAtlas['parcellations'].find(p => p['@id'] === (parcellationSelected && parcellationSelected['@id']))

    viewreHelperState['selectedAtlasId'] = selectedAtlas && selectedAtlas['@id']
    viewreHelperState['overlayingAdditionalParcellations'] = (overlayLayer && !overlayLayer['baseLayer'])
      ? [ overlayLayer ]
      : []
  })()

  return returnState
}

export const cvtStateToHashedRoutes = (state): string[] => {
  // TODO check if this causes memleak
  const selectedAtlas =  viewerStateGetSelectedAtlas(state)
  const selectedTemplate = viewerStateSelectedTemplateSelector(state)
  const selectedParcellation = viewerStateSelectedParcellationSelector(state)
  const selectedRegions = viewerStateSelectedRegionsSelector(state)
  const standaloneVolumes = viewerStateSelectorStandaloneVolumes(state)
  const navigation = viewerStateSelectorNavigation(state)

  const previewingDatasetFiles = uiStatePreviewingDatasetFilesSelector(state)
  let dsPrvString: string
  if (previewingDatasetFiles && Array.isArray(previewingDatasetFiles)) {
    const dsPrvArr = []
    const datasetPreviews = (previewingDatasetFiles as {datasetId: string, filename: string}[])
    for (const preview of datasetPreviews) {
      dsPrvArr.push(preview)
    }

    if (dsPrvArr.length === 1) {
      dsPrvString = `${dsPrvArr[0].datasetId}::${dsPrvArr[0].filename}`
    }
  }

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
  let selectedRegionsString
  if (selectedRegions.length === 1) {
    const region = selectedRegions[0]
    const { ngId, labelIndex } = region
    selectedRegionsString = `${ngId}::${labelIndex}`
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
    r: selectedRegionsString && encodeURI(selectedRegionsString),
    // nav
    ['@']: cNavString,
    // dataset file preview
    dsp: dsPrvString && encodeURI(dsPrvString),
  } as TUrlPathObj<string, TUrlAtlas<string>>

  /**
   * if any params needs to overwrite previosu routes, put them here
   */
  if (standaloneVolumes && Array.isArray(standaloneVolumes) && standaloneVolumes.length > 0) {
    routes = {
      // standalone volumes
      sv: encodeURIComponent(JSON.stringify(standaloneVolumes)),
      // nav
      ['@']: cNavString,
      dsp: dsPrvString && encodeURI(dsPrvString)
    } as TUrlPathObj<string, TUrlStandaloneVolume<string>>
  }

  const returnRoutes = []
  for (const key in routes) {
    if (!!routes[key]) {
      returnRoutes.push(
        endcodePath(key, routes[key])
      )
    }
  }
  return returnRoutes
}

@Component({
  template: ''
})
export class DummyCmp{}

export const routes = [{
  path: '**',
  component: DummyCmp
}]
