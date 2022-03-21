import { createSelector, select } from "@ngrx/store";
import { forkJoin, pipe } from "rxjs";
import { distinctUntilChanged, map, switchMap } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { jsonEqual } from "src/util/json";
import * as selectors from "./selectors"

const allAvailSpaces = (sapi: SAPI) => pipe(
  select(selectors.selectedAtlas),
  switchMap(atlas => forkJoin(
    atlas.spaces.map(spcWId => sapi.getSpaceDetail(atlas["@id"], spcWId["@id"])))
  )
)

const allAvailParcs = (sapi: SAPI) => pipe(
  select(selectors.selectedAtlas),
  switchMap(atlas =>
    forkJoin(
      atlas.parcellations.map(parcWId => sapi.getParcDetail(atlas["@id"], parcWId["@id"]))
    )
  )
)
const allAvailSpacesParcs = (sapi: SAPI) => pipe(
  select(selectors.selectedAtlas),
  switchMap(atlas =>
    forkJoin({
      spaces: atlas.spaces.map(spcWId => sapi.getSpaceDetail(atlas["@id"], spcWId["@id"])),
      parcellation: atlas.parcellations.map(parcWId => sapi.getParcDetail(atlas["@id"], parcWId["@id"])),
    })
  )
)

const nonDistinctATP = createSelector(
  selectors.selectedAtlas,
  selectors.selectedTemplate,
  selectors.selectedParcellation,
  (atlas, template, parcellation) => ({ atlas, template, parcellation })
)

const distinctATP = () => pipe(
  select(nonDistinctATP),
  distinctUntilChanged(
    jsonEqual((o, n) => o?.["@id"] === n?.["@id"])
  ),
  map(val => val as { atlas: SapiAtlasModel, parcellation: SapiParcellationModel, template: SapiSpaceModel })
)

export const fromRootStore = {
  allAvailSpaces,
  allAvailParcs,
  allAvailSpacesParcs,
  distinctATP,
}
