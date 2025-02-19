import { Injectable } from "@angular/core";
import { ParcellationVisibilityService } from "./parcellationVis.service";
import { createEffect } from "@ngrx/effects";
import { map } from "rxjs/operators";
import { atlasAppearance } from "src/state";

@Injectable()
export class ParcellationVisEffect {
  onEmitToggleDelineation = createEffect(() => this.svc.visibility$.pipe(
    map(flag => atlasAppearance.actions.setShowDelineation({ flag }))
  ))

  constructor(private svc: ParcellationVisibilityService){}
}
