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
