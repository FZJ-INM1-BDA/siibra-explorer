import { createAction, props } from "@ngrx/store"
import { nameSpace } from "./const"
import { Annotation } from "./store"

export const clearAllAnnotations = createAction(
  `${nameSpace} clearAllAnnotations`
)

export const rmAnnotations = createAction(
  `${nameSpace} rmAnnotations`,
  props<{
    annotations: Annotation[]
  }>()
)

export const addAnnotations = createAction(
  `${nameSpace} addAnnotations`,
  props<{
    annotations: Annotation[]
  }>()
)
