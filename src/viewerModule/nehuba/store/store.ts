import { createReducer, on } from "@ngrx/store";
import * as actions from "./actions"
import { INehubaFeature } from "./type";


/**
 * TODO port from global store to feature store
 */

export enum EnumPanelMode {
  FOUR_PANEL = 'FOUR_PANEL',
  V_ONE_THREE = 'V_ONE_THREE',
  H_ONE_THREE = 'H_ONE_THREE',
  SINGLE_PANEL = 'SINGLE_PANEL',
  PIP_PANEL = 'PIP_PANEL',
}

const defaultState: INehubaFeature = {
  layers: [],
  panelMode: EnumPanelMode.FOUR_PANEL,
  panelOrder: '0123',
  octantRemoval: true,
  auxMeshes: [],
  auxTransparency: 1.0
}

export const reducer = createReducer(
  defaultState,
  on(actions.actionSetAuxMeshes, (state, { payload }) => {
    return {
      ...state,
      auxMeshes: payload
    }
  }),
  on(actions.actionSetAuxMesh, (state, { payload }) => {
    return {
      ...state,
      auxMeshes: state.auxMeshes.map(v => v['@id'] === payload['@id']
        ? payload
        : v)
    }
  }),
  on(actions.actionRemoveAuxMesh, (state, {payload}) => {
    return {
      ...state,
      auxMeshes: state.auxMeshes.filter(v => v['@id'] !== payload['@id'])
    }
  }),
  on(actions.actionRemoveAuxMesh, state => {
    return {
      ...state,
      auxMeshes: []
    }
  }),
  on(actions.setAuxTransparency, (state, { alpha }) => {
    return {
      ...state,
      auxTransparency: alpha
    }
  }),
  
  on(actions.toggleAuxTransparency, state => {
    return {
      ...state,
      auxTransparency: state.auxTransparency < 1 ? 1 : 0.2
    }
  })
)
