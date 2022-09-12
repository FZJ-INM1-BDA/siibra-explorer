import { Pipe, PipeTransform } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { SapiSpaceModel } from "src/atlasComponents/sapi/type";
import { atlasSelection } from "src/state";
import { ParcellationSupportedInSpacePipe } from "./parcellationSupportedInSpace.pipe"

@Pipe({
  name: "spaceSupportedInCurrentParcellation",
  /**
   * the pipe is not exactly pure, since it makes http call
   * but for the sake of angular change detection, this is suitable
   * since the result should only change on input change
   */
  pure: true
})

export class SpaceSupportedInCurrentParcellationPipe implements PipeTransform{
  private supportedPipe = new ParcellationSupportedInSpacePipe(this.sapi)
  private selectedParcellation$ = this.store.pipe(
    select(atlasSelection.selectors.selectedParcellation)
  )
  constructor(
    private store: Store,
    private sapi: SAPI
  ){

  }
  public transform(space: SapiSpaceModel): Observable<{ supported: boolean; spaces?: string[]; }> {
    return this.selectedParcellation$.pipe(
      switchMap(parc => 
        this.supportedPipe.transform(parc, space)
      )
    )
  }
}
