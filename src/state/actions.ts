import { createAction, props } from "@ngrx/store";
import { nameSpace } from "./const"

const generalActionError = createAction(
  `${nameSpace} generalActionError`,
  props<{
    message: string
  }>()
)

export const actions = {
  generalActionError
}
