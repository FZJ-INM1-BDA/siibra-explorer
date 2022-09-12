import { Pipe, PipeTransform } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import {switchMap, tap} from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";
import { atlasSelection } from "src/state";
import { ParcellationSupportedInSpacePipe } from "./parcellationSupportedInSpace.pipe"

@Pipe({
  name: 'parcellationSupportedInCurrentSpace',
  /**
   * the pipe is not exactly pure, since it makes http call
   * but for the sake of angular change detection, this is suitable
   * since the result should only change on input change
   */
  pure: true
})

export class ParcellationSupportedInCurrentSpace implements PipeTransform{

  private transformPipe = new ParcellationSupportedInSpacePipe(this.sapi)

  private selectedTemplate$ = this.store.pipe(
    select(atlasSelection.selectors.selectedTemplate)
  )
  constructor(
    private store: Store,
    private sapi: SAPI,
  ){}

  public transform(parcellation: SapiParcellationModel)
    : Observable<{supported: boolean, spaces?: Array<string>}> {
    return this.selectedTemplate$.pipe(
      switchMap(tmpl => this.transformPipe.transform(parcellation, tmpl))
    )
  }
}
