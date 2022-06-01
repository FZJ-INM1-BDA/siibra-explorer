import { createAction, props } from "@ngrx/store"
import { nameSpace } from "./const"
import { SapiRegionModel, SapiFeatureModel, OpenMINDSCoordinatePoint } from "src/atlasComponents/sapi"

export const mouseOverAnnotations = createAction(
  `${nameSpace} mouseOverAnnotations`,
  props<{
    annotations: {
      "@id": string
    }[]
  }>()
)

export const mouseoverRegions = createAction(
  `${nameSpace} mouseoverRegions`,
  props<{
    regions: SapiRegionModel[]
  }>()
)

export const mouseoverPosition = createAction(
  `${nameSpace} mouseoverPosition`,
  props<{
    position: OpenMINDSCoordinatePoint
  }>()
)

export const showFeature = createAction(
  `${nameSpace} showFeature`,
  props<{
    feature: SapiFeatureModel
  }>()
)

export const clearShownFeature = createAction(
  `${nameSpace} clearShownFeature`,
)
