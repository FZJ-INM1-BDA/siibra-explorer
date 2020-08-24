import { createSelector } from "@ngrx/store";

export const ngViewerSelectorClearView = createSelector(
  (state: any) => state?.ngViewerState?.clearViewQueue,
  (clearViewQueue, props) => {
    
    if (!!props && !!props.id) {
      for (const key in clearViewQueue) {
        if (key === props.id) return !!clearViewQueue[key]
      }
      return false
    } else {
      return Object.keys(clearViewQueue).some(key => !!clearViewQueue[key])
    }
  }
)
