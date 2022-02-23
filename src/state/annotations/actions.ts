import { createAction, props } from "@ngrx/store"
import { nameSpace } from "./const"
import { Annotation } from "./store"

const clearAllAnnotations = createAction(
  `${nameSpace} clearAllAnnotations`
)

const rmAnnotations = createAction(
  `${nameSpace} rmAnnotation`,
  props<{
    annotations: Annotation[]
  }>()
)

export const actions = {
  clearAllAnnotations,
  rmAnnotations,
}
