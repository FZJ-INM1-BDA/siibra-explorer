import { createAction, props } from "@ngrx/store"
import { nameSpace } from "./const"
import { SxplrRegion, Feature, Point } from "src/atlasComponents/sapi/type_sxplr"

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
    regions: SxplrRegion[]
  }>()
)

export const mouseoverPosition = createAction(
  `${nameSpace} mouseoverPosition`,
  props<{
    position: Point
  }>()
)

export const showFeature = createAction(
  `${nameSpace} showFeature`,
  props<{
    feature: Feature
  }>()
)

export const clearShownFeature = createAction(
  `${nameSpace} clearShownFeature`,
)
