import { createSelector } from "@ngrx/store";
import { nameSpace } from "./const"
import { UiStore } from "./store"

const selectStore = state => state[nameSpace] as UiStore

export const panelMode = createSelector(
  selectStore,
  state => state.panelMode
)

export const panelOrder = createSelector(
  selectStore,
  state => state.panelOrder
)
