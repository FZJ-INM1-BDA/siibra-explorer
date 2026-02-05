import { createAction, props } from "@ngrx/store";
import { CustomLayer, nameSpace, UseViewer } from "./const"

export const setOctantRemoval = createAction(
  `${nameSpace} setOctantRemoval`,
  props<{
    flag: boolean
  }>()
)

export const setMeshTransparency = createAction(
  `${nameSpace} setMeshTransparency`,
  props<{
    alpha: number
  }>()
)

export const toggleMeshTransparency = createAction(
  `${nameSpace} toggleMeshTransparency`
)

export const toggleOctantRemoval = createAction(
  `${nameSpace} toggleOctantRemoval`
)

export const setShowDelineation = createAction(
  `${nameSpace} setShowDelineation`,
  props<{
    flag: boolean
  }>()
)

export const toggleParcDelineation = createAction(
  `${nameSpace} toggleDelineation`,
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
    customLayers: { id: string }[]
  }>()
)

export const setUseViewer = createAction(
  `${nameSpace} useViewer`,
  props<{
    viewer: UseViewer
  }>()
)

export const setShowAllSegMeshes = createAction(
  `[${nameSpace}] setShowAllMeshes`,
  props<{
    flag: boolean
  }>()
)

export const clearSubstrate = createAction(`[${nameSpace}] clearSubstrate`)
