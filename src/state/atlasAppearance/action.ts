import { createAction, props } from "@ngrx/store";
import { nameSpace } from "./const"

export const overwriteColorMap = createAction(
  `${nameSpace} overwriteColorMap`,
  props<{
    colormap: Record<string, number[]>
  }>()
)

export const setOctantRemoval = createAction(
  `${nameSpace} setOctantRemoval`,
  props<{
    flag: boolean
  }>()
)

export const setShowDelineation = createAction(
  `${nameSpace} setShowDelineation`,
  props<{
    flag: boolean
  }>()
)