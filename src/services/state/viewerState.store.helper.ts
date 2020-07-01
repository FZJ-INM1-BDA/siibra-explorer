// TODO merge with viewerstate.store.ts when refactor is done
import { createAction, props, createReducer, on, ActionReducer, createSelector } from "@ngrx/store";
import { reduce } from "rxjs/operators";

export interface IRegion{
  name: string
  [key: string]: string
}

export const viewerStateSetSelectedRegions = createAction(
  '[viewerState] setSelectedRegions',
  props<{ selectRegions: IRegion[] }>()
)

export const viewerStateSetConnectivityRegion = createAction(
  `[viewerState] setConnectivityRegion`,
  props<{ connectivityRegion: any }>()
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
  props<{ atlas: { ['@id']: string } }>()
)

export const viewerStateToggleAdditionalLayer = createAction(
  `[viewerState] toggleAdditionalLayer`,
  props<{ atlas: { ['@id']: string }  }>()
)

export const viewerStateRemoveAdditionalLayer = createAction(
  `[viewerState] removeAdditionalLayer`,
  props<{ atlas: { ['@id']: string } }>()
)

interface IViewerStateHelperStore{
  fetchedAtlases: any[]
  selectedAtlasId: string
  overlayingAdditionalParcellations: any[]
}

const initialState: IViewerStateHelperStore = {
  fetchedAtlases: [],
  selectedAtlasId: null,
  overlayingAdditionalParcellations: []
}

export const viewerStateHelperReducer = createReducer(
  initialState,
  on(viewerStateSetFetchedAtlases, (state, { fetchedAtlases }) => ({ ...state, fetchedAtlases })),
  on(viewerStateSelectAtlas, (state, { atlas }) => ({ ...state, selectedAtlasId: atlas['@id'] })),
  on(viewerStateToggleAdditionalLayer, (state, { atlas }) => {
    const { overlayingAdditionalParcellations } = state
    const layerAlreadyDisplayed = overlayingAdditionalParcellations.find(p => p['@id'] === atlas['@id'])

    /**
     * TODO this logic only allows for at most one additional layer to be displayed
     */
    return {
      ...state,
      overlayingAdditionalParcellations: layerAlreadyDisplayed
        ? []
        : [ atlas ]
    }
  }),
  on(viewerStateRemoveAdditionalLayer, (state, { atlas }) => {
    const { overlayingAdditionalParcellations } = state
    return {
      ...state,
      overlayingAdditionalParcellations: overlayingAdditionalParcellations.filter(p => p['@id'] !== atlas['@id'])
    }
  })
)

export const viewerStateHelperStoreName = 'viewerStateHelper'

export const viewerStateGetOverlayingAdditionalParcellations = createSelector(
  state => state[viewerStateHelperStoreName],
  localState => localState.overlayingAdditionalParcellations
)

export const viewerStateGetSelectedAtlas = createSelector(
  state => state[viewerStateHelperStoreName],
  ({ selectedAtlasId, fetchedAtlases }) => {
    return selectedAtlasId && fetchedAtlases.find(a => a['@id'] === selectedAtlasId)
  }
)

export function viewerStateFleshOutDetail(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    if (action.type === viewerStateSelectAtlas.type) {
      const reconstitutedAtlas = state[viewerStateHelperStoreName].fetchedAtlases.find(a => a['@id'] === (action as any).atlas['@id'])
      return reducer(state, { type: action.type, atlas: reconstitutedAtlas } as any)
    }
    return reducer(state, action)
  }
}