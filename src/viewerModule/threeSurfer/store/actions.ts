import { createAction, props } from "@ngrx/store";
import { nameSpace } from "./const"

export const selectSurfaceVariant = createAction(
  `${nameSpace} selectSurfaceVariant`,
  props<{
    variant: string
  }>()
)
