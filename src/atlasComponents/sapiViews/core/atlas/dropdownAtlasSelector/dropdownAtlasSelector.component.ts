import { Component } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable } from "rxjs";
import { ARIA_LABELS } from 'common/constants'
import { atlasSelection } from "src/state"
import { SAPI, SapiAtlasModel } from "src/atlasComponents/sapi";

@Component({
  selector: 'sxplr-sapiviews-core-atlas-dropdown-selector',
  templateUrl: './dropdownAtlasSelector.template.html',
  styleUrls: [
    './dropdownAtlasSelector.style.css'
  ]
})

export class SapiViewsCoreAtlasAtlasDropdownSelector{

  public fetchedAtlases$: Observable<SapiAtlasModel[]> = this.sapi.atlases$
  public selectedAtlas$: Observable<SapiAtlasModel> = this.store$.pipe(
    select(atlasSelection.selectors.selectedAtlas)
  )

  public SELECT_ATLAS_ARIA_LABEL = ARIA_LABELS.SELECT_ATLAS

  constructor(
    private store$: Store<any>,
    private sapi: SAPI,
  ){
    this.selectedAtlas$.subscribe(val => console.log('sel atlas changed', val))
  }

  handleChangeAtlas({ value }) {
    this.store$.dispatch(
      atlasSelection.actions.selectATPById({
        atlasId: value
      })
    )
  }
}

