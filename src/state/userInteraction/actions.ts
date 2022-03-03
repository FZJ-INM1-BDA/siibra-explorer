import { createAction, props } from "@ngrx/store"
import { nameSpace } from "./const"
import * as atlasSelection from "../atlasSelection"
import { SapiRegionModel, SapiSpatialFeatureModel, SapiVolumeModel } from "src/atlasComponents/sapi"
import * as userInterface from "../userInterface"

export const {
  clearSelectedRegions,
  clearStandAloneVolumes,
  clearNonBaseParcLayer,
} = atlasSelection.actions

export const {
  openSidePanel,
  closeSidePanel,
  expandSidePanelDetailView,
} = userInterface.actions

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
    feature: SapiSpatialFeatureModel
  }>()
)

export const clearShownFeature = createAction(
  `${nameSpace} clearShownFeature`,
)
