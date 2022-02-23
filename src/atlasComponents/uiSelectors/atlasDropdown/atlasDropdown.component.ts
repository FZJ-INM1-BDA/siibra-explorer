import { Component } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable } from "rxjs";
import { ARIA_LABELS } from 'common/constants'
import { atlasSelection } from "src/state"
import { SAPI } from "src/atlasComponents/sapi";

@Component({
  selector: 'atlas-dropdown-selector',
  templateUrl: './atlasDropdown.template.html',
  styleUrls: [
    './atlasDropdown.style.css'
  ]
})

export class AtlasDropdownSelector{

  public fetchedAtlases$: Observable<any[]>
  public selectedAtlas$: Observable<any>

  public SELECT_ATLAS_ARIA_LABEL = ARIA_LABELS.SELECT_ATLAS

  constructor(
    private store$: Store<any>,
    private sapi: SAPI,
  ){
    this.fetchedAtlases$ = this.sapi.atlases$
    this.selectedAtlas$ = this.store$.pipe(
      select(atlasSelection.selectors.selectedAtlas)
    )
  }

  handleChangeAtlas({ value }) {
    this.store$.dispatch(
      atlasSelection.actions.selectATPById({
        atlasId: value
      })
    )
  }
}

