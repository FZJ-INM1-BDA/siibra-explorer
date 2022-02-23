import { TemplateRef } from "@angular/core";
import { MatBottomSheetConfig } from "@angular/material/bottom-sheet";
import { MatSnackBarConfig } from "@angular/material/snack-bar";
import { createAction, props } from "@ngrx/store";
import { nameSpace } from "./const"

export const showFeature = createAction(
  `${nameSpace} showFeature`,
  props<{
    feature: {
      "@id": string
    }
  }>()
)

export const clearShownFeature = createAction(
  `${nameSpace} clearShownFeature`,
)

export const openSidePanel = createAction(
  `${nameSpace} openSidePanel`
)

export const closeSidePanel = createAction(
  `${nameSpace} closeSidePanel`
)

export const expandSidePanelDetailView = createAction(
  `${nameSpace} expandDetailView`
)

export const showBottomSheet = createAction(
  `${nameSpace} showBottomSheet`,
  props<{
    template: TemplateRef<any>
    config?: MatBottomSheetConfig
  }>()
)

export const snackBarMessage = createAction(
  `${nameSpace} snackBarMessage`,
  props<{
    message: string
    config?: MatSnackBarConfig
  }>()
)
