// TODO merge with viewerstate.store.ts when refactor is done
import { createAction, props } from "@ngrx/store";

export interface IRegion{
  name: string
  [key: string]: string
}

export const viewerStateSetSelectedRegions = createAction(
  '[viewerState] setSelectedRegions',
  props<{ selectRegions: IRegion[] }>()
)
