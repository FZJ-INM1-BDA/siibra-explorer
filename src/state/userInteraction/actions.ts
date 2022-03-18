import { createAction, props } from "@ngrx/store"
import { nameSpace } from "./const"
import { SapiRegionModel } from "src/atlasComponents/sapi"
import { SapiFeatureModel } from "src/atlasComponents/sapi/type"

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

export const showFeature = createAction(
  `${nameSpace} showFeature`,
  props<{
    feature: SapiFeatureModel
  }>()
)

export const clearShownFeature = createAction(
  `${nameSpace} clearShownFeature`,
)
