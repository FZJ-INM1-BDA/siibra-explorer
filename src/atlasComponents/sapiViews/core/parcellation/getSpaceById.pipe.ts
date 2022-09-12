import {Pipe, PipeTransform} from "@angular/core";
import {Store} from "@ngrx/store";
import {atlasSelection} from "src/state";
import {SAPI, SapiSpaceModel,} from "src/atlasComponents/sapi";
import {Observable} from "rxjs";
import {filter, map} from "rxjs/operators";

@Pipe({
  name: 'getSpaceById',
  pure: false,
})

export class GetSpaceByIdPipe implements PipeTransform {

  private allAvailableSpaces$ = this.store$.pipe(
    atlasSelection.fromRootStore.allAvailSpaces(this.sapi)
  )

  constructor(private store$: Store, private sapi: SAPI){}

  public transform(spaceId: string)
    : Observable<SapiSpaceModel> {
    return this.allAvailableSpaces$.pipe(
      filter(s => s && s.length > 0),
      map(res => res.filter(t => t.fullName).find(t => t['@id'] === spaceId))
    )
  }
}