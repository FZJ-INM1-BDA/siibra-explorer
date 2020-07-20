import { createAction, props } from "@ngrx/store"
import { INgLayerInterface } from './constants'

export const ngViewerActionAddNgLayer = createAction(
  '[ngLayerAction] addNgLayer',
  props<{ layer: INgLayerInterface|INgLayerInterface[] }>()
)

export const ngViewerActionRemoveNgLayer = createAction(
  '[ngLayerAction] removeNgLayer',
  props<{ layer: Partial<INgLayerInterface>|Partial<INgLayerInterface>[] }>()
)

export const ngViewerActionSetPerspOctantRemoval = createAction(
  `[ngViewerAction] setPerspectiveOctant`,
  props<{ octantRemovalFlag: boolean }>()
)

export const ngViewerActionToggleMax = createAction(
  `[ngViewerAction] toggleMax`,
  props<{ payload: { index: number } }>()
)