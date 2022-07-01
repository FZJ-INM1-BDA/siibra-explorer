import { TemplateRef } from "@angular/core";
import { MatBottomSheetConfig } from "@angular/material/bottom-sheet";
import { MatSnackBarConfig } from "@angular/material/snack-bar";
import { createAction, props } from "@ngrx/store";
import { nameSpace, PanelMode } from "./const"


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


export const setPanelMode = createAction(
  `${nameSpace} setPanelMode`,
  props<{
    panelMode: PanelMode
  }>()
)

export const cyclePanelMode = createAction(
  `${nameSpace} cyclePanelMode`
)

export const toggleMaximiseView = createAction(
  `${nameSpace} toggleMaximiseView`,
  props<{
    targetIndex: number
  }>()
)

export const setPanelOrder = createAction(
  `${nameSpace} setPanelOrder`,
  props<{
    order: string
  }>()
)