import { createAction, props } from "@ngrx/store";
import { nameSpace } from "./const"

export const clearInitManifests = createAction(
  `${nameSpace} clearInitManifests`,
  props<{
    nameSpace: string
  }>()
)

export const setInitMan = createAction(
  `${nameSpace} setInitMan`,
  props<{
    nameSpace: string
    url: string
    internal?: boolean
  }>()
)
