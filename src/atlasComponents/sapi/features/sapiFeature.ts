import { switchMap } from "rxjs/operators";
import { SAPI } from "../sapi.service";
import { SapiFeatureModel } from "../type";

export class SAPIFeature {
  constructor(private sapi: SAPI, public id: string, public opts: Record<string, string> = {}){

  }

  public detail$ = SAPI.BsEndpoint$.pipe(
    switchMap(endpt => this.sapi.httpGet<SapiFeatureModel>(
      `${endpt}/features/${this.id}`,
      this.opts
    ))
  )
}
