import { createAction, props } from "@ngrx/store";
import { nameSpace } from "./const"

export const overwriteColorMap = createAction(
  `${nameSpace} overwriteColorMap`,
  props<{
    colormap: Record<string, number[]>
  }>()
)
