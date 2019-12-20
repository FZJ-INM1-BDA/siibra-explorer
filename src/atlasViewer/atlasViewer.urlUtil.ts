import { getGetRegionFromLabelIndexId } from "src/services/effect/effect";
import { mixNgLayers } from "src/services/state/ngViewerState.store";
import { CONSTANTS as PLUGINSTORE_CONSTANTS } from 'src/services/state/pluginState.store'
import { generateLabelIndexId, getNgIdLabelIndexFromRegion, IavRootStoreInterface } from "../services/stateStore.service";
import { decodeToNumber, encodeNumber, GLSL_COLORMAP_JET, separator } from "./atlasViewer.constantService.service";

export const PARSING_SEARCHPARAM_ERROR = {
  TEMPALTE_NOT_SET: 'TEMPALTE_NOT_SET',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  PARCELLATION_NOT_UPDATED: 'PARCELLATION_NOT_UPDATED',
}
const PARSING_SEARCHPARAM_WARNING = {
  UNKNOWN_PARCELLATION: 'UNKNOWN_PARCELLATION',
  DECODE_CIPHER_ERROR: 'DECODE_CIPHER_ERROR',
}

export const CVT_STATE_TO_SEARCHPARAM_ERROR = {
  TEMPLATE_NOT_SELECTED: 'TEMPLATE_NOT_SELECTED',
}

export const cvtStateToSearchParam = (state: IavRootStoreInterface): URLSearchParams => {
  const searchParam = new URLSearchParams()

  const { viewerState, ngViewerState, pluginState } = state
  const { templateSelected, parcellationSelected, navigation, regionsSelected } = viewerState

  if (!templateSelected) { throw new Error(CVT_STATE_TO_SEARCHPARAM_ERROR.TEMPLATE_NOT_SELECTED) }

  // encoding states
  searchParam.set('templateSelected', templateSelected.name)
  searchParam.set('parcellationSelected', parcellationSelected.name)

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
  searchParam.set('cRegionsSelected', JSON.stringify(cRegionObj))

  // encoding navigation
  const { orientation, perspectiveOrientation, perspectiveZoom, position, zoom } = navigation
  const cNavString = [
    orientation.map(n => encodeNumber(n, {float: true})).join(separator),
    perspectiveOrientation.map(n => encodeNumber(n, {float: true})).join(separator),
    encodeNumber(Math.floor(perspectiveZoom)),
    Array.from(position).map((v: number) => Math.floor(v)).map(n => encodeNumber(n)).join(separator),
    encodeNumber(Math.floor(zoom)),
  ].join(`${separator}${separator}`)
  searchParam.set('cNavigation', cNavString)

  // encode nifti layers
  const initialNgState = templateSelected.nehubaConfig.dataset.initialNgState
  const { layers } = ngViewerState
  const additionalLayers = layers.filter(layer =>
    /^blob\:/.test(layer.name) &&
    Object.keys(initialNgState.layers).findIndex(layerName => layerName === layer.name) < 0,
  )
  const niftiLayers = additionalLayers.filter(layer => /^nifti\:\/\//.test(layer.source))
  if (niftiLayers.length > 0) { searchParam.set('niftiLayers', niftiLayers.join('__')) }

  // plugin state
  const { initManifests } = pluginState
  const pluginStateParam = initManifests
    .filter(([ src ]) => src !== PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC)
    .map(([ src, url]) => url)
    .join('__')

  if (initManifests.length > 0) { searchParam.set('pluginState', pluginStateParam) }

  return searchParam
}

export const cvtSearchParamToState = (searchparams: URLSearchParams, state: IavRootStoreInterface, callback?: (error: any) => void): IavRootStoreInterface => {

  const returnState = JSON.parse(JSON.stringify(state)) as IavRootStoreInterface

  // tslint:disable-next-line:no-empty
  const warningCb = callback || (() => {})

  const { TEMPLATE_NOT_FOUND, TEMPALTE_NOT_SET, PARCELLATION_NOT_UPDATED } = PARSING_SEARCHPARAM_ERROR
  const { UNKNOWN_PARCELLATION, DECODE_CIPHER_ERROR } = PARSING_SEARCHPARAM_WARNING
  const { fetchedTemplates } = state.viewerState

  const searchedTemplatename = (() => {
    const param = searchparams.get('templateSelected')
    if (param === 'Allen Mouse') { return `Allen adult mouse brain reference atlas V3` }
    if (param === 'Waxholm Rat V2.0') { return 'Waxholm Space rat brain atlas v.2.0' }
    return param
  })()
  const searchedParcellationName = (() => {
    const param = searchparams.get('parcellationSelected')
    if (param === 'Allen Mouse Brain Atlas') { return 'Allen adult mouse brain reference atlas V3 Brain Atlas' }
    if (param === 'Whole Brain (v2.0)') { return 'Waxholm Space rat brain atlas v.2.0' }
    return param
  })()

  if (!searchedTemplatename) { throw new Error(TEMPALTE_NOT_SET) }

  const templateToLoad = fetchedTemplates.find(template => template.name === searchedTemplatename)
  if (!templateToLoad) { throw new Error(TEMPLATE_NOT_FOUND) }

  /**
   * TODO if search param of either template or parcellation is incorrect, wrong things are searched
   */
  const parcellationToLoad = templateToLoad.parcellations.find(parcellation => parcellation.name === searchedParcellationName)
  if (!parcellationToLoad) { warningCb({ type: UNKNOWN_PARCELLATION }) }

  const { viewerState } = returnState
  viewerState.templateSelected = templateToLoad
  viewerState.parcellationSelected = parcellationToLoad || templateToLoad.parcellations[0]

  /* selected regions */

  // TODO deprecate. Fallback (defaultNgId) (should) already exist
  // if (!viewerState.parcellationSelected.updated) throw new Error(PARCELLATION_NOT_UPDATED)

  const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({ parcellation: viewerState.parcellationSelected })
  /**
   * either or both parcellationToLoad and .regions maybe empty
   */
  /**
   * backwards compatibility
   */
  const selectedRegionsParam = searchparams.get('regionsSelected')
  if (selectedRegionsParam) {
    const ids = selectedRegionsParam.split('_')

    viewerState.regionsSelected = ids.map(labelIndexId => getRegionFromlabelIndexId({ labelIndexId }))
  }

  const cRegionsSelectedParam = searchparams.get('cRegionsSelected')
  if (cRegionsSelectedParam) {
    try {
      const json = JSON.parse(cRegionsSelectedParam)

      const selectRegionIds = []

      for (const ngId in json) {
        // see https://palantir.github.io/tslint/rules/forin/
        if (json.hasOwnProperty(ngId)) {
          const val = json[ngId]
          const labelIndicies = val.split(separator).map(n => {
            try {
              return decodeToNumber(n)
            } catch (e) {
              /**
               * TODO poisonsed encoded char, send error message
               */
              warningCb({ type: DECODE_CIPHER_ERROR, message: `cRegionSelectionParam is malformed: cannot decode ${n}` })
              return null
            }
          }).filter(v => !!v)
          for (const labelIndex of labelIndicies) {
            selectRegionIds.push( generateLabelIndexId({ ngId, labelIndex }) )
          }
        }
      }
      viewerState.regionsSelected = selectRegionIds.map(labelIndexId => getRegionFromlabelIndexId({ labelIndexId }))

    } catch (e) {
      /**
       * parsing cRegionSelected error
       */
      warningCb({ type: DECODE_CIPHER_ERROR, message: `parsing cRegionSelected error ${e.toString()}` })
    }
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
          shader : GLSL_COLORMAP_JET,
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
  return returnState
}
