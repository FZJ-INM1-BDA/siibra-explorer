import { createSelector } from "@ngrx/store"
import { nameSpace } from "./const"
import { Store } from "./store"

const selectStore = state => state[nameSpace] as Store

export const getSelectedSurfaceVariant = createSelector(
  selectStore,
  ({ selectedSurfaceVariant }) => selectedSurfaceVariant
)
