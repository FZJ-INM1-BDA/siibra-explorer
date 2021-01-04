import { createAction, props } from "@ngrx/store";
import { INgLayerInterface } from "src/services/state/ngViewerState.store";
import { NEHUBA_VIEWER_FEATURE_KEY } from "./constants";

export const actionAddNgLayer = createAction(
  `[${NEHUBA_VIEWER_FEATURE_KEY}] [addNgLayer]`,
  props<{
    layers: INgLayerInterface[]
  }>()
)