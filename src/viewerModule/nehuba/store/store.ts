import { createReducer, on } from "@ngrx/store";
import { actionRemoveAuxMesh, actionSetAuxMesh, actionSetAuxMeshes } from "./actions";
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
  clearViewQueue: {},
  auxMeshes: []
}

export const reducer = createReducer(
  defaultState,
  on(actionSetAuxMeshes, (state, { payload }) => {
    return {
      ...state,
      auxMeshes: payload
    }
  }),
  on(actionSetAuxMesh, (state, { payload }) => {
    return {
      ...state,
      auxMeshes: state.auxMeshes.map(v => v['@id'] === payload['@id']
        ? payload
        : v)
    }
  }),
  on(actionRemoveAuxMesh, (state, {payload}) => {
    return {
      ...state,
      auxMeshes: state.auxMeshes.filter(v => v['@id'] !== payload['@id'])
    }
  }),
  on(actionRemoveAuxMesh, state => {
    return {
      ...state,
      auxMeshes: []
    }
  })
)
