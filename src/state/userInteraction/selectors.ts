import { createSelector } from "@ngrx/store";
import { nameSpace } from "./const"
import { UserInteraction } from "./store";

const selectStore = state => state[nameSpace] as UserInteraction

export const mousingOverRegions = createSelector(
  selectStore,
  state => state.mouseoverRegions
)

export const selectedFeature = createSelector(
  selectStore,
  state => state.selectedFeature
)

export const mousingOverPosition = createSelector(
  selectStore,
  state => state.mouseoverPosition
)

export const mousingOverVoiFeature = createSelector(
  selectStore,
  state => state.mousedOverVoiFeature
)
