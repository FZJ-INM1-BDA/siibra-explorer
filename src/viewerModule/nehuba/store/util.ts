import { select } from "@ngrx/store";
import { forkJoin, of, pipe } from "rxjs";
import { switchMap, map, take, filter, shareReplay } from "rxjs/operators";
import { SAPI, SAPIParcellation, SapiParcellationModel, SAPISpace } from "src/atlasComponents/sapi";
import { atlasSelection } from "src/state";
import { getRegionLabelIndex } from "../config.service/util";

export type ParcVolumeSpec = {
  volumeSrc: string
  labelIndicies: number[]
  parcellation: SapiParcellationModel
  laterality: 'left hemisphere' | 'right hemisphere' | 'whole brain'
}
