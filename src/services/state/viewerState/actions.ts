import { createAction, props } from "@ngrx/store"
import { IRegion } from './constants'

export const viewerStateNewViewer = createAction(
  `[viewerState] newViewer`,
  props<{
    selectTemplate: any
    selectParcellation: any
    navigation?: any
  }>()
)

export const viewerStateSetSelectedRegionsWithIds = createAction(
  `[viewerState] setSelectedRegionsWithIds`,
  props<{ selectRegionIds: string[] }>()
)

export const viewerStateSetSelectedRegions = createAction(
  '[viewerState] setSelectedRegions',
  props<{ selectRegions: IRegion[] }>()
)

export const viewerStateSetConnectivityRegion = createAction(
  `[viewerState] setConnectivityRegion`,
  props<{ connectivityRegion: any }>()
)

export const viewerStateNehubaLayerchanged = createAction(
  `[viewerState] nehubaLayerChanged`,
)

export const viewerStateNavigateToRegion = createAction(
  `[viewerState] navigateToRegion`,
  props<{ payload: { region: any } }>()
)

export const viewerStateToggleRegionSelect = createAction(
  `[viewerState] toggleRegionSelect`,
  props<{ payload: { region: any } }>()
)

export const viewerStateSetFetchedAtlases = createAction(
  '[viewerState] setFetchedatlases',
  props<{ fetchedAtlases: any[] }>()
)

export const viewerStateSelectAtlas = createAction(
  `[viewerState] selectAtlas`,
  props<{
    atlas: {
      ['@id']: string
      template?: {
        ['@id']: string
      }
    }
  }>()
)

export const viewerStateHelperSelectParcellationWithId = createAction(
  `[viewerStateHelper] selectParcellationWithId`,
  props<{ payload: { ['@id']: string } }>()
)

export const viewerStateSelectParcellation = createAction(
  `[viewerState] selectParcellation`,
  props<{ selectParcellation: any }>()
)

export const viewerStateSelectTemplateWithName = createAction(
  `[viewerState] selectTemplateWithName`,
  props<{ payload: { name: string } }>()
)

export const viewerStateSelectTemplateWithId = createAction(
  `[viewerState] selectTemplateWithId`,
  props<{ payload: { ['@id']: string }, config?: { selectParcellation: { ['@id']: string } } }>()
)

export const viewerStateToggleLayer = createAction(
  `[viewerState] toggleLayer`,
  props<{ payload: { ['@id']: string }  }>()
)

export const viewerStateRemoveAdditionalLayer = createAction(
  `[viewerState] removeAdditionalLayer`,
  props<{ payload?: { ['@id']: string } }>()
)

export const viewerStateSelectRegionWithIdDeprecated = createAction(
  `[viewerState] [deprecated] selectRegionsWithId`,
  props<{ selectRegionIds: string[] }>()
)

export const viewerStateSetViewerMode = createAction(
  `[viewerState] setViewerMode`,
  props<{payload: string}>()
)

export const viewerStateDblClickOnViewer = createAction(
  `[viewerState] dblClickOnViewer`,
  props<{ payload: { segments: any, landmark: any, userLandmark: any } }>()
)

export const viewerStateAddUserLandmarks = createAction(
  `[viewerState] addUserlandmark,`,
  props<{ landmarks: any[] }>()
)

export const viewreStateRemoveUserLandmarks = createAction(
  `[viewerState] removeUserLandmarks`,
  props<{ payload: { landmarkIds: string[] } }>()
)

export const viewerStateMouseOverCustomLandmark = createAction(
  '[viewerState] mouseOverCustomLandmark',
  props<{ payload: { userLandmark: any } }>()
)

export const viewerStateMouseOverCustomLandmarkInPerspectiveView = createAction(
  `[viewerState] mouseOverCustomLandmarkInPerspectiveView`,
  props<{ payload: { label: string } }>()
)

export const viewerStateChangeNavigation = createAction(
  `[viewerState] changeNavigation`,
  props<{ navigation: any }>()
)

export const actionSetMobileUi = createAction(
  `[viewerState] setMobileUi`,
  props<{ payload: { useMobileUI: boolean } }>()
)

export const actionAddToRegionsSelectionWithIds = createAction(
  `[viewerState] addToRegionSelectionWithIds`,
  props<{
    selectRegionIds: string[]
  }>()
)

export const actionSelectLandmarks = createAction(
  `[viewerState] selectLandmarks`,
  props<{
    landmarks: any[]
  }>()
)
