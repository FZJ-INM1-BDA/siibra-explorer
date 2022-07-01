import { createAction, props } from "@ngrx/store";
import { nameSpace } from "./const"

export const selectVolumeById = createAction(
  `${nameSpace} selectVolumeById`,
  props<{
    id: string
  }>()
)
