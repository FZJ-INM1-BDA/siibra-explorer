import { createAction, props } from "@ngrx/store";
import { MainState, nameSpace } from "./const"

export const generalActionError = createAction(
  `${nameSpace} generalActionError`,
  props<{
    message: string
  }>()
)

export const generalApplyState = createAction(
  `${nameSpace} generalApplyState`,
  props<{
    state: MainState
  }>()
)

export const initRouteParseComplete = createAction(
  `${nameSpace} initRouteParseComplete`
)

export const noop = createAction(
  `${nameSpace} noop`
)