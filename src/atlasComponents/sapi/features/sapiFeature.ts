import { SAPI } from "../sapi.service";
import { SapiFeatureModel } from "../type";

export class SAPIFeature {
  constructor(private sapi: SAPI, public id: string, public opts: Record<string, string> = {}){

  }

  public detail$ = this.sapi.httpGet<SapiFeatureModel>(
    `${SAPI.BsEndpoint}/features/${this.id}`,
    this.opts
  )
}
