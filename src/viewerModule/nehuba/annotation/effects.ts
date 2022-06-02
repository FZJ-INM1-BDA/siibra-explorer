import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { distinctUntilChanged, map } from "rxjs/operators";
import { annotation, atlasAppearance } from "src/state"

@Injectable()
export class NgAnnotationEffects{
  constructor(private store: Store){}

  onAnnotationHideQuadrant = createEffect(() => this.store.pipe(
    select(annotation.selectors.spaceFilteredAnnotations),
    map(arr => arr.length > 0),
    distinctUntilChanged(),
    map(spaceFilteredAnnotationExists => {
      return atlasAppearance.actions.setOctantRemoval({
        flag: !spaceFilteredAnnotationExists
      })
    }),
  ))
}
