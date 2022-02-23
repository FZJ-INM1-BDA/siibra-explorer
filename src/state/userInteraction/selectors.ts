import { createAction, createSelector, props } from "@ngrx/store";
import { SapiRegionModel } from "src/atlasComponents/sapi";
import { nameSpace } from "./const"
import { UserInteraction } from "./store";

const selectStore = state => state[nameSpace] as UserInteraction

export const mousingOverRegions = createSelector(
  selectStore,
  state => state.mouseoverRegions
)
