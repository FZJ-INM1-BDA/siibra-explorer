import { createSelector } from "@ngrx/store";
import { nameSpace } from "./const"
import { UiStore } from "./store"

const selectStore = state => state[nameSpace] as UiStore

export const selectedFeature = createSelector(
  selectStore,
  state => state.selectedFeature
)
