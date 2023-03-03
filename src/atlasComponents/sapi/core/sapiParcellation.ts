import { Observable, of } from "rxjs"
import { SAPI } from "../sapi.service"
import { SapiParcellationModel } from "../typeV3"
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

  getDetail(): Observable<SapiParcellationModel>{
    return this.sapi.v3Get(`/parcellations/{parcellation_id}`, {
      path: {
        parcellation_id: this.id
      },
    })
  }

  getLabelledMap(spaceId: string) {
    return this.sapi.getMap(this.id, spaceId, "LABELLED")
  }

  static Features$ = of(Object.keys(ParcellationFeatures) as PF[])
  public features$ = SAPIParcellation.Features$
}
