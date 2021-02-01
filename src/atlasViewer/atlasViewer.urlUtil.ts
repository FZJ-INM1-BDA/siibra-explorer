import { getGetRegionFromLabelIndexId } from "src/services/effect/effect";
import { mixNgLayers } from "src/services/state/ngViewerState.store";
import { PLUGINSTORE_CONSTANTS } from 'src/services/state/pluginState.store'
import { generateLabelIndexId, getNgIdLabelIndexFromRegion, IavRootStoreInterface } from "../services/stateStore.service";
import { decodeToNumber, encodeNumber, separator } from "./atlasViewer.constantService.service";
import { getShader, PMAP_DEFAULT_CONFIG } from "src/util/constants";
import { viewerStateHelperStoreName } from "src/services/state/viewerState.store.helper";
export const PARSING_SEARCHPARAM_ERROR = {
  TEMPALTE_NOT_SET: 'TEMPALTE_NOT_SET',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  PARCELLATION_NOT_UPDATED: 'PARCELLATION_NOT_UPDATED',
}
const PARSING_SEARCHPARAM_WARNING = {
  UNKNOWN_PARCELLATION: 'UNKNOWN_PARCELLATION',
  DECODE_CIPHER_ERROR: 'DECODE_CIPHER_ERROR',
  ID_ERROR: 'ID_ERROR'
}

export const CVT_STATE_TO_SEARCHPARAM_ERROR = {
  TEMPLATE_NOT_SELECTED: 'TEMPLATE_NOT_SELECTED',
}

export const cvtStateToSearchParam = (state: any): URLSearchParams => {
  const searchParam = new URLSearchParams()

  const { viewerState, pluginState, uiState } = state
  const { templateSelected, parcellationSelected, navigation, regionsSelected, standaloneVolumes } = viewerState

  if (standaloneVolumes && Array.isArray(standaloneVolumes) && standaloneVolumes.length > 0) {
    searchParam.set('standaloneVolumes', JSON.stringify(standaloneVolumes))
  } else {
    if (!templateSelected) { throw new Error(CVT_STATE_TO_SEARCHPARAM_ERROR.TEMPLATE_NOT_SELECTED) }

    // encoding states
    searchParam.set('templateSelected', templateSelected.name)
    if (!!parcellationSelected) searchParam.set('parcellationSelected', parcellationSelected.name)
  
    // encoding selected regions
    const accumulatorMap = new Map<string, number[]>()
    for (const region of regionsSelected) {
      const { ngId, labelIndex } = getNgIdLabelIndexFromRegion({ region })
      const existingEntry = accumulatorMap.get(ngId)
      if (existingEntry) { existingEntry.push(labelIndex) } else { accumulatorMap.set(ngId, [ labelIndex ]) }
    }
    const cRegionObj = {}
    for (const [key, arr] of accumulatorMap) {
      cRegionObj[key] = arr.map(n => encodeNumber(n)).join(separator)
    }
    if (Object.keys(cRegionObj).length > 0) searchParam.set('cRegionsSelected', JSON.stringify(cRegionObj))  
  }
  // encoding navigation
  if (navigation) {
    const { orientation, perspectiveOrientation, perspectiveZoom, position, zoom } = navigation
    if (orientation && perspectiveOrientation && perspectiveZoom && position && zoom) {
      const cNavString = [
        orientation.map(n => encodeNumber(n, {float: true})).join(separator),
        perspectiveOrientation.map(n => encodeNumber(n, {float: true})).join(separator),
        encodeNumber(Math.floor(perspectiveZoom)),
        Array.from(position).map((v: number) => Math.floor(v)).map(n => encodeNumber(n)).join(separator),
        encodeNumber(Math.floor(zoom)),
      ].join(`${separator}${separator}`)
      searchParam.set('cNavigation', cNavString)
    }
  }

  // plugin state
  const { initManifests } = pluginState
  const pluginStateParam = (initManifests as any[])
    .filter(([ src ]) => src !== PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC)
    .map(([ _src, url]) => url)
    .join('__')

  // previewDataset state

  const { previewingDatasetFiles } = uiState

  if (previewingDatasetFiles && Array.isArray(previewingDatasetFiles)) {
    const dsPrvArr = []
    const datasetPreviews = (previewingDatasetFiles as {datasetId: string, filename: string}[])
    for (const preview of datasetPreviews) {
      dsPrvArr.push(preview)
    }

    if (dsPrvArr.length > 0) searchParam.set('previewingDatasetFiles', JSON.stringify(dsPrvArr))
  }

  if (initManifests.length > 0) { searchParam.set('pluginState', pluginStateParam) }

  return searchParam
}

const { TEMPLATE_NOT_FOUND, TEMPALTE_NOT_SET, PARCELLATION_NOT_UPDATED } = PARSING_SEARCHPARAM_ERROR
const { UNKNOWN_PARCELLATION, DECODE_CIPHER_ERROR, ID_ERROR } = PARSING_SEARCHPARAM_WARNING

const parseSearchParamForTemplateParcellationRegion = (searchparams: URLSearchParams, state: IavRootStoreInterface, cb?: (arg: any) => void) => {


  /**
   * TODO if search param of either template or parcellation is incorrect, wrong things are searched
   */


  const templateSelected = (() => {
    const { fetchedTemplates } = state.viewerState

    const searchedName = (() => {
      const param = searchparams.get('templateSelected')
      if (param === 'Allen Mouse') { return `Allen adult mouse brain reference atlas V3` }
      if (param === 'Waxholm Rat V2.0') { return 'Waxholm Space rat brain atlas v.2.0' }
      return param
    })()

    if (!searchedName) { throw new Error(TEMPALTE_NOT_SET) }
    const templateToLoad = fetchedTemplates.find(template => template.name === searchedName)
    if (!templateToLoad) { throw new Error(TEMPLATE_NOT_FOUND) }
    return templateToLoad
  })()

  const parcellationSelected = (() => {
    const searchedName = (() => {
      const param = searchparams.get('parcellationSelected')
      if (param === 'Allen Mouse Brain Atlas') { return 'Allen adult mouse brain reference atlas V3 Brain Atlas' }
      if (param === 'Whole Brain (v2.0)') { return 'Waxholm Space rat brain atlas v.2.0' }
      return param
    })()
    const parcellationToLoad = templateSelected.parcellations.find(parcellation => parcellation.name === searchedName)
    if (!parcellationToLoad) { cb && cb({ type: UNKNOWN_PARCELLATION }) }
    return parcellationToLoad || templateSelected.parcellations[0]
  })()

  /* selected regions */

  const regionsSelected = (() => {

    // TODO deprecate. Fallback (defaultNgId) (should) already exist
    // if (!viewerState.parcellationSelected.updated) throw new Error(PARCELLATION_NOT_UPDATED)

    const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({ parcellation: parcellationSelected })
    /**
     * either or both parcellationToLoad and .regions maybe empty
     */
    /**
     * backwards compatibility
     */
    const selectedRegionsParam = searchparams.get('regionsSelected')
    if (selectedRegionsParam) {
      const ids = selectedRegionsParam.split('_')
      return ids.map(labelIndexId => getRegionFromlabelIndexId({ labelIndexId })).filter(v => !!v)
    }

    const cRegionsSelectedParam = searchparams.get('cRegionsSelected')
    if (cRegionsSelectedParam) {
      try {
        const json = JSON.parse(cRegionsSelectedParam)

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
              cb && cb({ type: DECODE_CIPHER_ERROR, message: `cRegionSelectionParam is malformed: cannot decode ${n}` })
              return null
            }
          }).filter(v => !!v)
          for (const labelIndex of labelIndicies) {
            selectRegionIds.push( generateLabelIndexId({ ngId, labelIndex }) )
          }
        }
        return selectRegionIds
          .map(labelIndexId => {
            const region = getRegionFromlabelIndexId({ labelIndexId })
            if (!region) cb && cb({ type: ID_ERROR, message: `region with id ${labelIndexId} not found, and will be ignored.` })
            return region
          })
          .filter(r => !!r)

      } catch (e) {
        /**
         * parsing cRegionSelected error
         */
        cb && cb({ type: DECODE_CIPHER_ERROR, message: `parsing cRegionSelected error ${e.toString()}` })
      }
    }
    return []
  })()

  return {
    templateSelected,
    parcellationSelected,
    regionsSelected
  }
}

export const cvtSearchParamToState = (searchparams: URLSearchParams, state: IavRootStoreInterface, callback?: (error: any) => void): IavRootStoreInterface => {

  const returnState = JSON.parse(JSON.stringify(state)) as IavRootStoreInterface

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  const warningCb = callback || (() => {})

  const { viewerState } = returnState

  const searchParamStandaloneVolumes = (() => {
    const param = searchparams.get('standaloneVolumes')
    if (!param) {
      return null
    }
    const arr = JSON.parse(param)
    if (Array.isArray(arr)) {
      return arr
    }
    else {
      throw new Error(`param standaloneVolumes does not parse to array: ${param}`)
    }
  })()

  if (!!searchParamStandaloneVolumes) {
    viewerState.standaloneVolumes = searchParamStandaloneVolumes
  } else {
    const { templateSelected, parcellationSelected, regionsSelected } = parseSearchParamForTemplateParcellationRegion(searchparams, state, warningCb)
    viewerState.templateSelected = templateSelected
    viewerState.parcellationSelected = parcellationSelected
    viewerState.regionsSelected = regionsSelected
  }
  
  /* now that the parcellation is loaded, load the navigation state */
  /* what to do with malformed navigation? */

  // for backwards compatibility
  const _viewerState = searchparams.get('navigation')
  if (_viewerState) {
    const [o, po, pz, p, z] = _viewerState.split('__')
    viewerState.navigation = {
      orientation : o.split('_').map(n => Number(n)),
      perspectiveOrientation : po.split('_').map(n => Number(n)),
      perspectiveZoom : Number(pz),
      position : p.split('_').map(n => Number(n)),
      zoom : Number(z),

      // flag to allow for animation when enabled
      animation: {},
    }
  }

  const cViewerState = searchparams.get('cNavigation')
  if (cViewerState) {
    try {
      const [ cO, cPO, cPZ, cP, cZ ] = cViewerState.split(`${separator}${separator}`)
      const o = cO.split(separator).map(s => decodeToNumber(s, {float: true}))
      const po = cPO.split(separator).map(s => decodeToNumber(s, {float: true}))
      const pz = decodeToNumber(cPZ)
      const p = cP.split(separator).map(s => decodeToNumber(s))
      const z = decodeToNumber(cZ)
      viewerState.navigation = {
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
    }
  }

  const niftiLayers = searchparams.get('niftiLayers')
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

  const { pluginState } = returnState
  const pluginStates = searchparams.get('pluginStates')
  if (pluginStates) {
    const arrPluginStates = pluginStates.split('__')
    pluginState.initManifests = arrPluginStates.map(url => [PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC, url] as [string, string])
  }

  const { uiState } = returnState
  const stringSearchParam = searchparams.get('previewingDatasetFiles')
  try {
    if (stringSearchParam) {
      const arr = JSON.parse(stringSearchParam) as Array<{datasetId: string, filename: string}>
      uiState.previewingDatasetFiles = arr.map(({ datasetId, filename }) => {
        return {
          datasetId,
          filename
        }
      })
    }
  } catch (e) {
    // parsing previewingDatasetFiles
  }

  /**
   * parsing template to get atlasId
   */
  (() => {

    const viewreHelperState = returnState[viewerStateHelperStoreName]
    const { templateSelected, parcellationSelected } = returnState['viewerState']
    const { fetchedAtlases, ...rest } = viewreHelperState
    
    const selectedAtlas = fetchedAtlases.find(a => a['templateSpaces'].find(t => t['@id'] === (templateSelected && templateSelected['@id'])))
    
    const overlayLayer = selectedAtlas && selectedAtlas['parcellations'].find(p => p['@id'] === (parcellationSelected && parcellationSelected['@id']))

    viewreHelperState['selectedAtlasId'] = selectedAtlas && selectedAtlas['@id']
    viewreHelperState['overlayingAdditionalParcellations'] = (overlayLayer && !overlayLayer['baseLayer'])
      ? [ overlayLayer ]
      : []
  })()

  return returnState
}
