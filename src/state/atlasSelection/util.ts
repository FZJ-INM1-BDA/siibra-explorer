import { createSelector, select } from "@ngrx/store";
import { forkJoin, of, pipe } from "rxjs";
import { distinctUntilChanged, map, switchMap } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { translateV3Entities } from "src/atlasComponents/sapi/translate_v3"
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/type_sxplr";
import { jsonEqual } from "src/util/json";
import * as selectors from "./selectors"

const nonDistinctATP = createSelector(
  selectors.selectedAtlas,
  selectors.selectedTemplate,
  selectors.selectedParcellation,
  (atlas, template, parcellation) => ({ atlas, template, parcellation })
)

const distinctATP = () => pipe(
  select(nonDistinctATP),
  distinctUntilChanged(
    jsonEqual((o, n) => o?.id === n?.id)
  ),
  map(val => val as { atlas: SxplrAtlas, parcellation: SxplrParcellation, template: SxplrTemplate })
)

export const fromRootStore = {
  distinctATP,
}
