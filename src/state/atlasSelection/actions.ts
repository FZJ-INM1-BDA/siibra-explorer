import { createAction, props } from "@ngrx/store";
import { SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { nameSpace, ViewerMode } from "./const"

export const selectAtlas = createAction(
  `${nameSpace} selectAtlas`,
  props<{
    atlas: SapiAtlasModel
  }>()
)

export const selectTemplate = createAction(
  `${nameSpace} selectTemplate`,
  props<{
    template: SapiSpaceModel
  }>()
)

export const selectParcellation = createAction(
  `${nameSpace} selectParcellation`,
  props<{
    parcellation: SapiParcellationModel
  }>()
)

export const selectRegions = createAction(
  `${nameSpace} selectRegions`,
  props<{
    regions: SapiRegionModel[]
  }>()
)

export const setStandAloneVolumes = createAction(
  `${nameSpace} setStandAloneVolumes`,
  props<{
    standAloneVolumes: string[]
  }>()
)

export const setNavigation = createAction(
  `${nameSpace} setNavigation`,
  props<{
    navigation: {
      position: number[]
      orientation: number[]
      zoom: number
      perspectiveOrientation: number[]
      perspectiveZoom: number
    }
  }>()
)

export const setViewerMode = createAction(
  `${nameSpace} setViewerMode`,
  props<{
    viewerMode: ViewerMode
  }>()
)

export const clearSelectedRegions = createAction(
  `${nameSpace} clearSelectedRegions`
)

export const selectATPById = createAction(
  `${nameSpace} selectATPById`,
  props<{
    atlasId?: string,
    templateId?: string
    parcellationId?: string
  }>()
)

export const clearNonBaseParcLayer = createAction(
  `${nameSpace} clearNonBaseParcLayer`
)

export const clearStandAloneVolumes = createAction(
  `${nameSpace} clearStandAloneVolumes`
)

export const navigateTo = createAction(
  `${nameSpace} navigateTo`,
  props<{
    navigation: Partial<{
      position: number[]
      orientation: number[]
      zoom: number
      perspectiveOrientation: number[]
      perspectiveZoom: number
    }>
    physical?: boolean
    animation?: boolean
  }>()
)

export const navigateToRegion = createAction(
  `${nameSpace} navigateToRegion`,
  props<{
    region: SapiRegionModel
  }>()
)

export const clearViewerMode = createAction(
  `${nameSpace} clearViewerMode`,
)

export const toggleRegionSelect = createAction(
  `${nameSpace} toggleRegionSelect`,
  props<{
    region: SapiRegionModel
  }>()
)

export const toggleRegionSelectById = createAction(
  `${nameSpace} toggleRegionSelectById`,
  props<{
    id: string
  }>()
)

export const viewSelRegionInNewSpace = createAction(
  `${nameSpace} viewSelRegionInNewSpace`,
  props<{
    region: SapiRegionModel
    template: SapiSpaceModel
  }>()
)