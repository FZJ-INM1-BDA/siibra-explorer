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

export const viewerStateHelperSelectParcellationWithId = createAction(
  `[viewerStateHelper] selectParcellationWithId`,
  props<{ payload: { ['@id']: string } }>()
)

export const viewerStateSelectParcellation = createAction(
  `[viewerState] selectParcellation`,
  props<{ selectParcellation: any }>()
)

export const viewerStateSelectTemplateWithId = createAction(
  `[viewerState] selectTemplateWithId`,
  props<{ payload: { ['@id']: string } }>()
)

export const viewerStateToggleLayer = createAction(
  `[viewerState] toggleLayer`,
  props<{ payload: { ['@id']: string }  }>()
)

export const viewerStateHelperToggleAdditionalLayer = createAction(
  `[viewerStateHelper] toggleAdditionalLayer`,
  props<{ payload: { ['@id']: string } }>()
)

export const viewerStateRemoveAdditionalLayer = createAction(
  `[viewerState] removeAdditionalLayer`,
  props<{ payload?: { ['@id']: string } }>()
)

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

function handleToggleLayerAction(reducer: ActionReducer<any>): ActionReducer<any>{
  return function(state, action) {
    switch(action.type){
    case viewerStateToggleLayer.type: {
      const { payload } = action as any
      const { fetchedAtlases, selectedAtlasId, overlayingAdditionalParcellations } = state[viewerStateHelperStoreName]
      const { templateSelected } = state['viewerState']
      const selectedAtlas = fetchedAtlases.find(atlas => atlas['@id'] === selectedAtlasId)
      const atlasBaseLayer = selectedAtlas['parcellations'].find(p => !!p['baseLayer'])
      if (atlasBaseLayer) {
        /**
           * if toggling base layer, remove all additional layers
           * otherwise, just toggle the payload layer
           */
        if (payload['@id'] === atlasBaseLayer['@id']) {
          return reducer(state, viewerStateRemoveAdditionalLayer({ payload: null }))
        } else {
          return reducer(state, viewerStateHelperToggleAdditionalLayer({ payload }))
        }
      } else {
        const selectParcellation = templateSelected['parcellations'].find(p => p['@id'] === payload['@id'])
        return reducer(state, viewerStateSelectParcellation({ selectParcellation }))
      }
    }
    case viewerStateSelectTemplateWithId.type: {
      /**
         * on template change clear additional parcellations/layers
         */
      return reducer({
        ...state,
        [viewerStateHelperStoreName]: {
          ...state[viewerStateHelperStoreName],
          overlayingAdditionalParcellations: []
        }
      }, action)
    }
    default: reducer(state, action)
    }
    return reducer(state, action)
  }
}

export const viewerStateMetaReducers = [
  handleToggleLayerAction
]



export const viewerStateHelperReducer = createReducer(
  initialState,
  on(viewerStateSetFetchedAtlases, (state, { fetchedAtlases }) => ({ ...state, fetchedAtlases })),
  on(viewerStateSelectAtlas, (state, { atlas }) => ({ ...state, selectedAtlasId: atlas['@id'] })),
  on(generalApplyState, (_prevState, { state }) => ({ ...state[viewerStateHelperStoreName] })),
  on(viewerStateHelperToggleAdditionalLayer, (state, { payload }) => {
    const { overlayingAdditionalParcellations } = state
    const layerAlreadyDisplayed = overlayingAdditionalParcellations.find(p => p['@id'] === payload['@id'])

    /**
     * TODO this logic only allows for at most one additional layer to be displayed
     */
    return {
      ...state,
      overlayingAdditionalParcellations: layerAlreadyDisplayed
        ? []
        : [ payload ]
    }
  }),
  on(viewerStateRemoveAdditionalLayer, (state, { payload }) => {
    const { overlayingAdditionalParcellations } = state
    return {
      ...state,
      overlayingAdditionalParcellations: !!payload
        ? overlayingAdditionalParcellations.filter(p => p['@id'] !== payload['@id'])
        : []
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

