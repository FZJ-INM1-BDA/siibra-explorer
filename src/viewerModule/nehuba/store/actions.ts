import { createAction, props } from "@ngrx/store";

import { NEHUBA_VIEWER_FEATURE_KEY } from "../constants";
import { IAuxMesh } from "./type";

export const actionAddNgLayer = createAction(
  `[${NEHUBA_VIEWER_FEATURE_KEY}] [addNgLayer]`,
  props<{
    layers: any[]
  }>()
)

export const actionSetAuxMesh = createAction(
  `[${NEHUBA_VIEWER_FEATURE_KEY}] [setAuxMesh]`,
  props<{
    payload: IAuxMesh
  }>()
)

export const actionRemoveAuxMesh = createAction(
  `[${NEHUBA_VIEWER_FEATURE_KEY}] [rmAuxMesh]`,
  props<{
    payload: { "@id": string }
  }>()
)

export const actionSetAuxMeshes = createAction(
  `[${NEHUBA_VIEWER_FEATURE_KEY}] [setAuxMeshes]`,
  props<{
    payload: IAuxMesh[]
  }>()
)

export const actionClearAuxMeshes = createAction(
  `[${NEHUBA_VIEWER_FEATURE_KEY}] [clearAuxMeshes]`
)
