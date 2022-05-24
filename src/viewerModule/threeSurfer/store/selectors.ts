import { createSelector } from "@ngrx/store"
import { nameSpace } from "./const"
import { Store } from "./store"

const selectStore = state => state[nameSpace] as Store

export const getSelectedVolumeId = createSelector(
  selectStore,
  ({ selectedVolumeId }) => selectedVolumeId
)
