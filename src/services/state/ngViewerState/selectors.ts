import { createSelector } from "@ngrx/store";

export const ngViewerSelectorClearViewEntries = createSelector(
  (state: any) => state?.ngViewerState?.clearViewQueue,
  (clearViewQueue = {}) => {
    const returnKeys = []
    for (const key in clearViewQueue) {
      if (!!clearViewQueue[key]) returnKeys.push(key)
    }
    return returnKeys
  }
)

export const ngViewerSelectorClearView = createSelector(
  ngViewerSelectorClearViewEntries,
  keys => keys.length > 0
)

export const ngViewerSelectorPanelOrder = createSelector(
  state => state['ngViewerState'],
  ngViewerState => ngViewerState.panelOrder
)

export const ngViewerSelectorPanelMode = createSelector(
  state => state['ngViewerState'],
  ngViewerState => ngViewerState.panelMode
)

export const ngViewerSelectorOctantRemoval = createSelector(
  state => state['ngViewerState'],
  ngViewerState => ngViewerState.octantRemoval
)
