import { createSelector } from "@ngrx/store"
import { nameSpace } from "./const"
import { Annotation, AnnotationState } from "./store"

const selectStore = state => state[nameSpace] as AnnotationState

export const annotations = createSelector(
  selectStore,
  state => state.annotations
)
