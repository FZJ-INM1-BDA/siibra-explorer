import { Injectable } from "@angular/core";
import { SAPI } from "./sapi.service"

@Injectable()
export class SapiEffects{

  constructor(
    private sapiSvc: SAPI
  ){

  }
}
