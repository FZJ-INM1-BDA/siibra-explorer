import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { map } from "rxjs/operators";
import { annotation, atlasAppearance } from "src/state"

@Injectable()
export class NgAnnotationEffects{
  constructor(private store: Store){}

  onAnnotationHideQuadrant = createEffect(() => this.store.pipe(
    select(annotation.selectors.spaceFilteredAnnotations),
    map(arr => {
      const spaceFilteredAnnotationExists = arr.length > 0
      return atlasAppearance.actions.setOctantRemoval({
        flag: !spaceFilteredAnnotationExists
      })
    }),
  ))
}
