// TODO to be merged with ng viewer state after refactor

import { createAction, props } from "@ngrx/store";

export interface INgLayerInterface {
  name: string // displayName
  source: string
  mixability: string // base | mixable | nonmixable
  annotation?: string //
  id?: string // unique identifier
  visible?: boolean
  shader?: string
  transform?: any
}

export const ngViewerActionAddNgLayer = createAction(
  '[ngLayerAction] addNgLayer',
  props<{ layer: INgLayerInterface|INgLayerInterface[] }>()
)

export const ngViewerActionRemoveNgLayer = createAction(
  '[ngLayerAction] removeNgLayer',
  props<{ layer: Partial<INgLayerInterface>|Partial<INgLayerInterface>[] }>()
)
