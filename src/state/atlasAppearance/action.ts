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

export const addCustomLayers = createAction(
  `${nameSpace} addCustomLayer`,
  props<{
    customLayers: CustomLayer[]
  }>()
)

export const removeCustomLayers = createAction(
  `${nameSpace} removeCustomLayer`,
  props<{
    customLayers: {id: string}[]
  }>()
)

export const setUseViewer = createAction(
  `${nameSpace} useViewer`,
  props<{
    viewer: UseViewer
  }>()
)
