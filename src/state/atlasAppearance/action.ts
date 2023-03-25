import { createAction, props } from "@ngrx/store";
import { CustomLayer, nameSpace, UseViewer } from "./const"

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

export const addCustomLayer = createAction(
  `${nameSpace} addCustomLayer`,
  props<{
    customLayer: CustomLayer
  }>()
)

export const removeCustomLayer = createAction(
  `${nameSpace} removeCustomLayer`,
  props<{
    id: string
  }>()
)

export const setUseViewer = createAction(
  `${nameSpace} useViewer`,
  props<{
    viewer: UseViewer
  }>()
)
