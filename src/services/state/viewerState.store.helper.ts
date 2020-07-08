// TODO merge with viewerstate.store.ts when refactor is done
import { createAction, props, createReducer, on, ActionReducer, createSelector, Store, select } from "@ngrx/store";
import { generalApplyState } from "../stateStore.helper";
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Observable } from "rxjs";
import { withLatestFrom, map } from "rxjs/operators";
import { Injectable } from "@angular/core";

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
  props<{ payload: { ['@id']: string }, config?: { selectParcellation: { ['@id']: string } } }>()
)

export const viewerStateToggleLayer = createAction(
  `[viewerState] toggleLayer`,
  props<{ payload: { ['@id']: string }  }>()
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
      const { templateSelected } = (state && state['viewerState']) || {}

      const selectParcellation = templateSelected['parcellations'].find(p => p['@id'] === payload['@id'])
      return reducer(state, viewerStateSelectParcellation({ selectParcellation }))
    }
    default: reducer(state, action)
    }
    return reducer(state, action)
  }
}

export const viewerStateMetaReducers = [
  handleToggleLayerAction
]

@Injectable({
  providedIn: 'root'
})

export class ViewerStateHelperEffect{
  @Effect()
  selectParcellationWithId$: Observable<any>

  constructor(
    private store$: Store<any>,
    private actions$: Actions
  ){
    this.selectParcellationWithId$ = this.actions$.pipe(
      ofType(viewerStateRemoveAdditionalLayer.type),
      withLatestFrom(this.store$.pipe(
        select(viewerStateGetSelectedAtlas)
      )),
      map(([ { payload }, selectedAtlas ]) => {
        const baseLayer = selectedAtlas['parcellations'].find(p => p['baseLayer'])
        return viewerStateHelperSelectParcellationWithId({ payload: baseLayer })
      })
    )
  }
}

export const viewerStateHelperReducer = createReducer(
  initialState,
  on(viewerStateSetFetchedAtlases, (state, { fetchedAtlases }) => ({ ...state, fetchedAtlases })),
  on(viewerStateSelectAtlas, (state, { atlas }) => ({ ...state, selectedAtlasId: atlas['@id'] })),
  on(generalApplyState, (_prevState, { state }) => ({ ...state[viewerStateHelperStoreName] })),
)

export const viewerStateHelperStoreName = 'viewerStateHelper'

export const viewerStateGetOverlayingAdditionalParcellations = createSelector(
  state => state[viewerStateHelperStoreName],
  state => state['viewerState'],
  (viewerHelperState, viewerState ) => {
    const { selectedAtlasId, fetchedAtlases } = viewerHelperState
    const { parcellationSelected } = viewerState

    const selectedAtlas = selectedAtlasId && fetchedAtlases.find(a => a['@id'] === selectedAtlasId)
    const atlasLayer =  selectedAtlas['parcellations'].find(p => p['@id'] === (parcellationSelected && parcellationSelected['@id']))
    const isBaseLayer = atlasLayer && atlasLayer.baseLayer
    return (!!atlasLayer && !isBaseLayer) ? [ atlasLayer ] : []
  }
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

