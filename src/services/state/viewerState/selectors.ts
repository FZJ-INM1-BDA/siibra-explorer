import { createSelector } from "@ngrx/store"
import { viewerStateHelperStoreName } from "../viewerState.store.helper"

export const viewerStateSelectedRegionsSelector = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['regionsSelected']
)

export const viewerStateCustomLandmarkSelector = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['userLandmarks']
)

const flattenFetchedTemplatesIntoParcellationsReducer = (acc, curr) => {
  const parcelations = (curr['parcellations'] || []).map(p => {
    return {
      ...p,
      useTheme: curr['useTheme']
    }
  })
  
  return acc.concat( parcelations )
}

export const viewerStateFetchedTemplatesSelector = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['fetchedTemplates']
)

export const viewerStateSelectedTemplateSelector = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['templateSelected']
)

export const viewerStateSelectedParcellationSelector = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['parcellationSelected']
)

export const viewerStateNavigationStateSelector = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['navigation']
)

export const viewerStateAllRegionsFlattenedRegionSelector = createSelector(
  viewerStateSelectedParcellationSelector,
  parc => {
    const returnArr = []
    const processRegion = region => {
      const { children, ...rest } = region
      returnArr.push({ ...rest })
      region.children && Array.isArray(region.children) && region.children.forEach(processRegion)
    }
    if (parc && parc.regions && Array.isArray(parc.regions)) {
      parc.regions.forEach(processRegion)
    }
    return returnArr
  }
)

export const viewerStateStandAloneVolumes = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['standaloneVolumes']
)

export const viewerStateSelectorNavigation = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['navigation']
)

export const viewerStateGetOverlayingAdditionalParcellations = createSelector(
  state => state[viewerStateHelperStoreName],
  state => state['viewerState'],
  (viewerHelperState, viewerState ) => {
    const { selectedAtlasId, fetchedAtlases } = viewerHelperState
    const { parcellationSelected } = viewerState
    const selectedAtlas = selectedAtlasId && fetchedAtlases.find(a => a['@id'] === selectedAtlasId)
    const hasBaseLayer = selectedAtlas?.parcellations.find(p => p.baseLayer)
    if (!hasBaseLayer) return []
    const atlasLayer =  selectedAtlas?.parcellations.find(p => p['@id'] === (parcellationSelected && parcellationSelected['@id']))
    const isBaseLayer = atlasLayer && atlasLayer.baseLayer
    return (!!atlasLayer && !isBaseLayer) ? [{
      ...(parcellationSelected || {} ),
      ...atlasLayer
    }] : []
  }
)


export const viewerStateGetSelectedAtlas = createSelector(
  state => state[viewerStateHelperStoreName],
  helperState => {
    if (!helperState) return null
    const { selectedAtlasId, fetchedAtlases } = helperState
    return selectedAtlasId && fetchedAtlases.find(a => a['@id'] === selectedAtlasId)
  }
)

export const viewerStateAtlasParcellationSelector = createSelector(
  state => state[viewerStateHelperStoreName],
  state => state['viewerState'],
  (viewerHelperState, viewerState) => {
    const { selectedAtlasId, fetchedAtlases } = viewerHelperState
    const { fetchedTemplates } = viewerState

    const allParcellations = fetchedTemplates.reduce(flattenFetchedTemplatesIntoParcellationsReducer, [])

    const selectedAtlas = selectedAtlasId && fetchedAtlases.find(a => a['@id'] === selectedAtlasId)
    const atlasLayers =  selectedAtlas?.parcellations
      .map(p => {
        const otherHalfOfParc = allParcellations.find(parc => parc['@id'] === p['@id']) || {}
        return {
          ...p,
          ...otherHalfOfParc,
        }
      })
    return atlasLayers
  }
)

export const viewerStateAtlasLatestParcellationSelector = createSelector(
  viewerStateAtlasParcellationSelector,
  parcs => parcs.filter( p => !p['@version'] || !p['@version']['@next'])
)

export const viewerStateParcVersionSelector = createSelector(
  viewerStateAtlasParcellationSelector,
  state => state['viewerState'],
  (allAtlasParcellations, viewerState) => {
    if (!viewerState || !viewerState.parcellationSelected) return []
    const returnParc = []
    const foundParc = allAtlasParcellations.find(p => p['@id'] === viewerState.parcellationSelected['@id'])
    if (!foundParc) return []
    returnParc.push(foundParc)
    const traverseParc = parc => {
      if (!parc) return []
      if (!parc['@version']) return []
      if (parc['@version']['@next']) {
        const nextParc = allAtlasParcellations.find(p => p['@id'] === parc['@version']['@next'])
        if (nextParc) {
          const nextParcAlreadyIncluded = returnParc.find(p => p['@id'] === nextParc['@id'])
          if (!nextParcAlreadyIncluded) {
            returnParc.unshift(nextParc)
            traverseParc(nextParc)
          }
        }
      }

      if (parc['@version']['@previous']) {
        const previousParc = allAtlasParcellations.find(p => p['@id'] === parc['@version']['@previous'])
        if (previousParc) {
          const previousParcAlreadyIncluded = returnParc.find(p => p['@id'] === previousParc['@id'])
          if (!previousParcAlreadyIncluded) {
            returnParc.push(previousParc)
            traverseParc(previousParc)
          }
        }
      }
    }
    traverseParc(foundParc)
    return returnParc
  }
)
