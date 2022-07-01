import { createAction, props } from "@ngrx/store";
import { nameSpace } from "./const"

export const clearInitManifests = createAction(
  `${nameSpace} clearInitManifests`,
  props<{
    nameSpace: string
  }>()
)
