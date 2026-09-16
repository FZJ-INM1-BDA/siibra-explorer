import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { selectors as atAppSelectors, actions as atAppActions } from ".";
import { filter, map } from "rxjs/operators";

@Injectable()
export class Effect {
  onSetOctantRemoval = createEffect(() => this.store.pipe(
    select(atAppSelectors.octantRemoval),
    filter(octRmFlag => octRmFlag),
    map(() => atAppActions.setMeshTransparency({ alpha: 1 }))
  ))

  constructor(private store: Store){

  }
}
