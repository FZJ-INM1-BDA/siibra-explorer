import { createSelector } from "@ngrx/store"

export const viewerStateSelectedRegionsSelector = createSelector(
  state => state['viewerState'],
  viewerState => viewerState['regionsSelected']
)

export const viewerStateAllParcellationsSelector = createSelector(
  state => state['viewerState'],
  viewerState => {
    return (viewerState['fetchedTemplates'] as any[] || [])
      .reduce((acc, curr) => {
        const parcelations = (curr['parcellations'] || []).map(p => {
          return {
            ...p,
            useTheme: curr['useTheme']
          }
        })
        
        return acc.concat( parcelations )
      }, [])
  }
)