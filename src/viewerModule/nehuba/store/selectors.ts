import { createSelector } from "@ngrx/store";
import { NEHUBA_VIEWER_FEATURE_KEY } from '../constants'
import { INehubaFeature, IAuxMesh } from "./type";

export const selectorAuxMeshes = createSelector<any, INehubaFeature, IAuxMesh[]>(
  state => state[NEHUBA_VIEWER_FEATURE_KEY],
  nehubaFeatureStore => nehubaFeatureStore['auxMeshes']
)

export const auxMeshTransparency = createSelector<any, INehubaFeature, number>(
  state => state[NEHUBA_VIEWER_FEATURE_KEY],
  nehubaFeatureStore => nehubaFeatureStore.auxTransparency
)