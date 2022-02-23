import { select } from "@ngrx/store";
import { forkJoin, pipe } from "rxjs";
import { switchMap } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
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

export const fromRootStore = {
  allAvailSpaces,
  allAvailParcs,
  allAvailSpacesParcs,
}
