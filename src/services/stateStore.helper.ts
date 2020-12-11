import { createAction, props } from "@ngrx/store";

export const GENERAL_ACTION_TYPES = {
  APPLY_STATE: 'APPLY_STATE',
}

export const generalApplyState = createAction(
  GENERAL_ACTION_TYPES.APPLY_STATE,
  props<{ state: any }>()
)

export const generalActionError = createAction(
  `[generalActionError]`,
  props<{ message: string }>()
)
