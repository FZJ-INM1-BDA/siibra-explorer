import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { tap } from 'rxjs/operators'
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { SxplrAtlas } from "src/atlasComponents/sapi/sxplrTypes";
import { atlasSelection } from "src/state"

@Component({
  selector : 'ui-splashscreen',
  templateUrl : './splashScreen.template.html',
  styleUrls : [
    `./splashScreen.style.css`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SapiViewsCoreAtlasSplashScreen {

  public finishedLoading: boolean = false

  public atlases$ = this.sapiSvc.atlases$.pipe(
    tap(() => this.finishedLoading = true)
  )

  constructor(
    private store: Store,
    private sapiSvc: SAPI,
  ) {
  }

  public selectAtlas(atlas: SxplrAtlas){
    this.store.dispatch(
      atlasSelection.actions.selectAtlas({
        atlas
      })
    )
  }
}
