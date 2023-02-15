import { Observable, of } from "rxjs"
import { switchMap } from "rxjs/operators"
import { SAPI } from "../sapi.service"
import { SapiParcellationModel, SapiQueryPriorityArg, SapiRegionModel, RouteParam } from "../type_v3"
import { SAPIBase } from "./base"

/**
 * All valid parcellation features
 */
const ParcellationFeatures = {
  RegionalConnectivity: "RegionalConnectivity",
} as const

export type PF = keyof typeof ParcellationFeatures

export class SAPIParcellation extends SAPIBase<PF>{
  constructor(private sapi: SAPI, public atlasId: string, public id: string){
    super(sapi)
  }

  getDetail(queryParam?: SapiQueryPriorityArg): Observable<SapiParcellationModel>{
    return this.sapi.v3Get(`/parcellations/{parcellation_id}`, {
      path: {
        parcellation_id: this.id
      },
      priority: queryParam?.priority
    })
  }

  getLabelledMap(spaceId: string, queryParam?: SapiQueryPriorityArg) {
    return this.sapi.getMap(this.id, spaceId, "LABELLED", queryParam)
  }

  static Features$ = of(Object.keys(ParcellationFeatures) as PF[])
  public features$ = SAPIParcellation.Features$
}
