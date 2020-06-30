import { Component } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { viewerStateHelperStoreName, viewerStateSelectAtlas } from "src/services/state/viewerState.store.helper";
import { ARIA_LABELS } from 'common/constants'

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

  constructor(private store$: Store<any>){
    this.fetchedAtlases$ = this.store$.pipe(
      select(viewerStateHelperStoreName),
      select('fetchedAtlases'),
      distinctUntilChanged()
    )
    this.selectedAtlas$ = this.store$.pipe(
      select(viewerStateHelperStoreName),
      distinctUntilChanged(),
      select(({ selectedAtlasId, fetchedAtlases }) => {
        return fetchedAtlases.find(atlas => atlas['@id'] === selectedAtlasId)
      })
    )
  }

  handleChangeAtlas({ value }) {
    this.store$.dispatch(
      viewerStateSelectAtlas({
        atlas: {
          ['@id']: value
        }
      })
    )
  }
}

