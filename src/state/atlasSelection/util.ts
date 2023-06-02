import { createSelector, select } from "@ngrx/store";
import { pipe } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
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
