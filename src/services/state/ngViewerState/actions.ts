import { createAction, props, createReducer } from "@ngrx/store"
import { INgLayerInterface } from './constants'

export const ngViewerActionAddNgLayer = createAction(
  '[ngLayerAction] addNgLayer',
  props<{ layer: INgLayerInterface|INgLayerInterface[] }>()
)

export const ngViewerActionRemoveNgLayer = createAction(
  '[ngLayerAction] removeNgLayer',
  props<{ layer: Partial<INgLayerInterface>|Partial<INgLayerInterface>[] }>()
)

export const ngViewerActionToggleMax = createAction(
  `[ngViewerAction] toggleMax`,
  props<{ payload: { index: number } }>()
)

export const ngViewerActionSetPanelOrder = createAction(
  `[ngViewerAction] setPanelOrder`,
  props<{ payload: { panelOrder: string } }>()
)

export const ngViewerActionSwitchPanelMode = createAction(
  `[ngViewerAction] switchPanelMode`,
  props<{ payload: { panelMode: string } }>()
)

export const ngViewerActionForceShowSegment = createAction(
  `[ngViewerAction] forceShowSegment`,
  props<{ forceShowSegment: boolean }>()
)

export const ngViewerActionNehubaReady = createAction(
  `[ngViewerAction] nehubaReady`,
  props<{ nehubaReady: boolean }>()
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
  props<{ payload: { [key: string]: boolean }}>()
)

export const ngViewerActionCycleViews = createAction(
  `[ngViewerAction] cycleView`
)