// TODO merge with viewerstate.store.ts when refactor is done
import { createReducer, on, ActionReducer, createSelector, Store, select } from "@ngrx/store";
import { generalApplyState } from "../stateStore.helper";
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Observable } from "rxjs";
import { withLatestFrom, map } from "rxjs/operators";
import { Injectable } from "@angular/core";

import {
  viewerStateNewViewer,
  viewerStateHelperSelectParcellationWithId,
  viewerStateNavigateToRegion,
  viewerStateRemoveAdditionalLayer,
  viewerStateSelectAtlas,
  viewerStateSelectParcellation,
  viewerStateSelectTemplateWithId,
  viewerStateSetConnectivityRegion,
  viewerStateSetFetchedAtlases,
  viewerStateSetSelectedRegions,
  viewerStateSetSelectedRegionsWithIds,
  viewerStateToggleLayer,
  viewerStateToggleRegionSelect,
  viewerStateSelectRegionWithIdDeprecated,
  viewerStateDblClickOnViewer,
  viewerStateAddUserLandmarks,
  viewreStateRemoveUserLandmarks,
  viewerStateMouseOverCustomLandmark,
  viewerStateMouseOverCustomLandmarkInPerspectiveView,
  viewerStateSelectTemplateWithName,
} from './viewerState/actions'

export {
  viewerStateNewViewer,
  viewerStateHelperSelectParcellationWithId,
  viewerStateNavigateToRegion,
  viewerStateRemoveAdditionalLayer,
  viewerStateSelectAtlas,
  viewerStateSelectParcellation,
  viewerStateSelectTemplateWithId,
  viewerStateSetConnectivityRegion,
  viewerStateSetFetchedAtlases,
  viewerStateSetSelectedRegions,
  viewerStateSetSelectedRegionsWithIds,
  viewerStateToggleLayer,
  viewerStateToggleRegionSelect,
  viewerStateSelectRegionWithIdDeprecated,
  viewerStateDblClickOnViewer,
  viewerStateAddUserLandmarks,
  viewreStateRemoveUserLandmarks,
  viewerStateMouseOverCustomLandmark,
  viewerStateMouseOverCustomLandmarkInPerspectiveView,
  viewerStateSelectTemplateWithName,
}

import {
  viewerStateSelectedRegionsSelector,
  viewerStateSelectedTemplateSelector,
  viewerStateSelectedParcellationSelector,
  viewerStateGetSelectedAtlas,
  viewerStateCustomLandmarkSelector,
  viewerStateFetchedTemplatesSelector,
  viewerStateNavigationStateSelector,
} from './viewerState/selectors'

export {
  viewerStateSelectedRegionsSelector,
  viewerStateSelectedTemplateSelector,
  viewerStateSelectedParcellationSelector,
  viewerStateCustomLandmarkSelector,
  viewerStateFetchedTemplatesSelector,
  viewerStateNavigationStateSelector,
}

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

      const selectParcellation = templateSelected?.parcellations.find(p => p['@id'] === payload['@id'])
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
  selectParcellationWithId$: Observable<any> = this.actions$.pipe(
    ofType(viewerStateRemoveAdditionalLayer.type),
    withLatestFrom(this.store$.pipe(
      select(viewerStateGetSelectedAtlas)
    )),
    map(([ { payload }, selectedAtlas ]) => {
      const baseLayer = selectedAtlas['parcellations'].find(p => p['baseLayer'])
      return viewerStateHelperSelectParcellationWithId({ payload: baseLayer })
    })
  )

  constructor(
    private store$: Store<any>,
    private actions$: Actions
  ){
    
  }
}

export const viewerStateHelperReducer = createReducer(
  initialState,
  on(viewerStateSetFetchedAtlases, (state, { fetchedAtlases }) => ({ ...state, fetchedAtlases })),
  on(viewerStateSelectAtlas, (state, { atlas }) => ({ ...state, selectedAtlasId: atlas['@id'] })),
  on(generalApplyState, (_prevState, { state }) => ({ ...state[viewerStateHelperStoreName] })),
)

export const viewerStateHelperStoreName = 'viewerStateHelper'

export function viewerStateFleshOutDetail(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    if (action.type === viewerStateSelectAtlas.type) {
      const reconstitutedAtlas = state[viewerStateHelperStoreName].fetchedAtlases.find(a => a['@id'] === (action as any).atlas['@id'])
      return reducer(state, { type: action.type, atlas: reconstitutedAtlas } as any)
    }
    return reducer(state, action)
  }
}

export const defaultState = initialState

interface IVersion{
  "@next": string
  "@this": string
  "name": string
  "@previous": string
}

interface IHasVersion{
  ['@version']: IVersion
}

interface IHasId{
  ['@id']: string
}

export function isNewerThan(arr: IHasVersion[], srcObj: IHasId, compObj: IHasId): boolean {

  function* GenNewerVersions(flag){
    let it = 0
    const newest =  arr.find((v => v['@version'] && v['@version']['@this'] === srcObj['@id']))
    if (!newest) throw new Error(`GenNewerVersions error newest element isn't found`)
    yield newest
    let currPreviousId = newest['@version'][ flag ? '@next' : '@previous' ]
    while (currPreviousId) {
      it += 1
      if (it>100) throw new Error(`iteration excced 100, did you include a loop?`)
      
      const curr = arr.find(v => v['@version']['@this'] === currPreviousId)
      if (!curr) throw new Error(`GenNewerVersions error, version id ${currPreviousId} not found`)
      currPreviousId = curr['@version'][ flag ? '@next' : '@previous' ]
      yield curr
    }
  }
  for (const obj of GenNewerVersions(true)) {
    if (obj['@version']['@this'] === compObj['@id']) {
      return false
    }
  }

  for (const obj of GenNewerVersions(false)) {
    if (obj['@version']['@this'] === compObj['@id']) {
      return true
    } 
  }
  
  throw new Error(`isNewerThan error, neither srcObj nor compObj exist in array`)
}
