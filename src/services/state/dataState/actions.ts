import { createAction, props } from "@ngrx/store";
import { IKgDataEntry } from "src/databrowser.fallback";

export const datastateActionToggleFav = createAction(
  `[datastate] toggleFav`,
  props<{payload: { fullId: string }}>()
)

export const datastateActionUpdateFavDataset = createAction(
  `[datastate] updateFav`,
  props<{ favDataEntries: any[] }>()
)

export const datastateActionUnfavDataset = createAction(
  `[datastate] unFav`,
  props<{ payload: { fullId: string } }>()
)

export const datastateActionFavDataset = createAction(
  `[datastate] fav`,
  props<{ payload: { fullId: string } }>()
)

export const datastateActionFetchedDataentries = createAction(
  `[datastate] fetchedDatastate`,
  props<{ fetchedDataEntries: IKgDataEntry[] }>()
)