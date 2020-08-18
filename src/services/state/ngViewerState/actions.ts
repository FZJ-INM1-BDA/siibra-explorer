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

/**
 * Clear viewer view from additional layers such as PMap or connectivity
 * To request view to be cleared, call 
 * this.store$.dispatch(
 *  ngViewerActionClearView({ 
 *    payload: {
 *      ['my-unique-id']: true
 *    }
 *  })
 * )
 * 
 * When finished, call
 * 
 * this.store$.dispatch(
 *   ngViewerActionClearView({
 *    payload: {
 *      ['my-unique-id']: false
 *    }
 *   })
 * )
 */
export const ngViewerActionClearView = createAction(
  `[ngViewerAction] clearView`,
  props<{ payload: { [key:string]: boolean }}>()
)
