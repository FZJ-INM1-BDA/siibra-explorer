// import { createSelector } from "@ngrx/store"
// import { SapiAtlasModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi"
// import { SapiRegionModel } from "src/atlasComponents/sapi/type"
// import { viewerStateHelperStoreName, IViewerStateHelperStore } from "../viewerState.store.helper"
// import { IViewerState } from "./type"

// import {
//   selectors as atlasSelectionSelectors
// } from "src/state/atlasSelection"

// const {
//   selectedATP: selectorSelectedATP,
//   selectedAtlas: viewerStateGetSelectedAtlas,
//   selectedParcellation: viewerStateSelectedParcellationSelector,
//   selectedTemplate: viewerStateSelectedTemplateSelector,
// } = atlasSelectionSelectors


// const viewerStateSelectedRegionsSelector = createSelector<any, any, SapiRegionModel[]>(
//   state => state['viewerState'],
//   viewerState => viewerState['regionsSelected']
// )

// const viewerStateCustomLandmarkSelector = createSelector(
//   state => state['viewerState'],
//   viewerState => viewerState['userLandmarks']
// )

// const flattenFetchedTemplatesIntoParcellationsReducer = (acc, curr) => {
//   const parcelations = (curr['parcellations'] || []).map(p => {
//     return {
//       ...p,
//       useTheme: curr['useTheme']
//     }
//   })

//   return acc.concat( parcelations )
// }

// const viewerStateFetchedTemplatesSelector = createSelector(
//   state => state['viewerState'],
//   viewerState => viewerState['fetchedTemplates']
// )

// const viewerStateSelectorFeatureSelector = createSelector(
//   (state: any) => state.viewerState as IViewerState,
//   viewerState => viewerState.featureSelected
// )

// /**
//  * viewerStateSelectedTemplateSelector may have it navigation mutated to allow for initiliasation of viewer at the correct navigation
//  * in some circumstances, it may be required to get the original navigation object
//  */
// const viewerStateSelectedTemplatePureSelector = createSelector(
//   viewerStateFetchedTemplatesSelector,
//   viewerStateSelectedTemplateSelector,
//   (fetchedTemplates, selectedTemplate) => {
//     if (!selectedTemplate) return null
//     return fetchedTemplates.find(t => t['@id'] === selectedTemplate['@id'])
//   }
// )

// const viewerStateNavigationStateSelector = createSelector(
//   state => state['viewerState'],
//   viewerState => viewerState['navigation']
// )

// const viewerStateOverwrittenColorMapSelector = createSelector(
//   state => state['viewerState'],
//   viewerState => viewerState['overwrittenColorMap']
// )

// const viewerStateSelectorNavigation = createSelector(
//   state => state['viewerState'],
//   viewerState => viewerState['navigation']
// )

// const viewerStateViewerModeSelector = createSelector(
//   state => state['viewerState'],
//   viewerState => viewerState['viewerMode']
// )

// const viewerStateGetOverlayingAdditionalParcellations = createSelector(
//   state => state[viewerStateHelperStoreName],
//   state => state['viewerState'],
//   (viewerHelperState, viewerState ) => {
//     const { selectedAtlasId, fetchedAtlases } = viewerHelperState
//     const { parcellationSelected } = viewerState
//     const selectedAtlas = selectedAtlasId && fetchedAtlases.find(a => a['@id'] === selectedAtlasId)
//     const hasBaseLayer = selectedAtlas?.parcellations.find(p => p.baseLayer)
//     if (!hasBaseLayer) return []
//     const atlasLayer =  selectedAtlas?.parcellations.find(p => p['@id'] === (parcellationSelected && parcellationSelected['@id']))
//     const isBaseLayer = atlasLayer && atlasLayer.baseLayer
//     return (!!atlasLayer && !isBaseLayer) ? [{
//       ...(parcellationSelected || {} ),
//       ...atlasLayer
//     }] : []
//   }
// )

// const viewerStateFetchedAtlasesSelector = createSelector<any, any, SapiAtlasModel[]>(
//   state => state[viewerStateHelperStoreName],
//   helperState => helperState['fetchedAtlases']
// )


// const viewerStateAtlasParcellationSelector = createSelector(
//   state => state[viewerStateHelperStoreName],
//   state => state['viewerState'],
//   (viewerHelperState, viewerState) => {
//     const { selectedAtlasId, fetchedAtlases } = viewerHelperState
//     const { fetchedTemplates } = viewerState

//     const allParcellations = fetchedTemplates.reduce(flattenFetchedTemplatesIntoParcellationsReducer, [])

//     const selectedAtlas = selectedAtlasId && fetchedAtlases.find(a => a['@id'] === selectedAtlasId)
//     const atlasLayers = selectedAtlas?.parcellations
//       .map(p => {
//         const otherHalfOfParc = allParcellations.find(parc => parc['@id'] === p['@id']) || {}
//         return {
//           ...p,
//           ...otherHalfOfParc,
//         }
//       })
//     return atlasLayers
//   }
// )

// const viewerStateAtlasLatestParcellationSelector = createSelector(
//   viewerStateAtlasParcellationSelector,
//   parcs => (parcs && parcs.filter( p => !p['@version'] || !p['@version']['@next']) || [])
// )

// const viewerStateParcVersionSelector = createSelector(
//   viewerStateAtlasParcellationSelector,
//   state => state['viewerState'],
//   (allAtlasParcellations, viewerState) => {
//     if (!viewerState || !viewerState.parcellationSelected) return []
//     const returnParc = []
//     const foundParc = allAtlasParcellations.find(p => p['@id'] === viewerState.parcellationSelected['@id'])
//     if (!foundParc) return []
//     returnParc.push(foundParc)
//     const traverseParc = parc => {
//       if (!parc) return []
//       if (!parc['@version']) return []
//       if (parc['@version']['@next']) {
//         const nextParc = allAtlasParcellations.find(p => p['@id'] === parc['@version']['@next'])
//         if (nextParc) {
//           const nextParcAlreadyIncluded = returnParc.find(p => p['@id'] === nextParc['@id'])
//           if (!nextParcAlreadyIncluded) {
//             returnParc.unshift(nextParc)
//             traverseParc(nextParc)
//           }
//         }
//       }

//       if (parc['@version']['@previous']) {
//         const previousParc = allAtlasParcellations.find(p => p['@id'] === parc['@version']['@previous'])
//         if (previousParc) {
//           const previousParcAlreadyIncluded = returnParc.find(p => p['@id'] === previousParc['@id'])
//           if (!previousParcAlreadyIncluded) {
//             returnParc.push(previousParc)
//             traverseParc(previousParc)
//           }
//         }
//       }
//     }
//     traverseParc(foundParc)
//     return returnParc
//   }
// )

// const viewerStateContextedSelectedRegionsSelector = createSelector(
//   viewerStateSelectedRegionsSelector,
//   viewerStateGetSelectedAtlas,
//   viewerStateSelectedTemplatePureSelector,
//   viewerStateSelectedParcellationSelector,
//   (regions, atlas, template, parcellation) => regions.map(r => {
//     return {
//       ...r,
//       context: {
//         atlas,
//         template,
//         parcellation
//       }
//     }
//   })
// )
