import { throwError } from "rxjs";
import { switchMap } from "rxjs/operators";
import { SAPI } from "../sapi.service";

export class SAPIFeature {
  constructor(private sapi: SAPI, public id: string, public opts: Record<string, string> = {}){

  }

  public detail$ = SAPI.BsEndpoint$.pipe(
    switchMap(endpt => throwError(`IMPLEMENT ME`))
  )
}
