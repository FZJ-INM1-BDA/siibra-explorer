import { createAction, props } from "@ngrx/store"

export const viewerStateNavigateToRegion = createAction(
  `[viewerState] navigateToRegion`,
  props<{ payload: { region: any } }>()
)

export const viewerStateSelectTemplateWithId = createAction(
  `[viewerState] selectTemplateWithId`,
  props<{ payload: { ['@id']: string }, config?: { selectParcellation: { ['@id']: string } } }>()
)

export const viewerStateAddUserLandmarks = createAction(
  `[viewerState] addUserlandmark,`,
  props<{ landmarks: any[] }>()
)

export const viewerStateMouseOverCustomLandmark = createAction(
  '[viewerState] mouseOverCustomLandmark',
  props<{ payload: { userLandmark: any } }>()
)

export const viewerStateMouseOverCustomLandmarkInPerspectiveView = createAction(
  `[viewerState] mouseOverCustomLandmarkInPerspectiveView`,
  props<{ payload: { label: string } }>()
)

export const actionSetMobileUi = createAction(
  `[viewerState] setMobileUi`,
  props<{ payload: { useMobileUI: boolean } }>()
)
