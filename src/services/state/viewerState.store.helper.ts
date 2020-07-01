// TODO merge with viewerstate.store.ts when refactor is done
import { createAction, props, createReducer, on, ActionReducer, createSelector } from "@ngrx/store";
import { generalApplyState } from "../stateStore.helper";

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

interface IViewerStateHelperStore{
  fetchedAtlases: any[]
  selectedAtlasId: string
  selectedParcellations: any[]
}

const initialState: IViewerStateHelperStore = {
  fetchedAtlases: [],
  selectedAtlasId: null,
  selectedParcellations: []
}

export const viewerStateHelperReducer = createReducer(
  initialState,
  on(viewerStateSetFetchedAtlases, (state, { fetchedAtlases }) => ({ ...state, fetchedAtlases })),
  on(viewerStateSelectAtlas, (state, { atlas }) => ({ ...state, selectedAtlasId: atlas['@id'] })),
  on(generalApplyState, (_prevState, { state }) => ({ ...state[viewerStateHelperStoreName] }))
)

export const viewerStateHelperStoreName = 'viewerStateHelper'

export const viewerStateGetParcellationsSelected = createSelector(
  state => state[viewerStateHelperStoreName],
  state => state.selectedParcellations
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

