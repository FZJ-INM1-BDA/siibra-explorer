import { createAction, props } from "@ngrx/store"
import { nameSpace } from "./const"
import { UnionAnnotation } from "./store"

export const clearAllAnnotations = createAction(
  `${nameSpace} clearAllAnnotations`
)

export const rmAnnotations = createAction(
  `${nameSpace} rmAnnotations`,
  props<{
    annotations: {'@id': string }[]
  }>()
)

export const addAnnotations = createAction(
  `${nameSpace} addAnnotations`,
  props<{
    annotations: UnionAnnotation[]
  }>()
)
