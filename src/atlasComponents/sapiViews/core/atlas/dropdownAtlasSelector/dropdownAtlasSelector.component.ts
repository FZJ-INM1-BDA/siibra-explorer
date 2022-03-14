import { Component, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { ARIA_LABELS } from 'common/constants'
import { atlasSelection, generalActions } from "src/state"
import { SAPI, SapiAtlasModel } from "src/atlasComponents/sapi";

@Component({
  selector: 'sxplr-sapiviews-core-atlas-dropdown-selector',
  templateUrl: './dropdownAtlasSelector.template.html',
  styleUrls: [
    './dropdownAtlasSelector.style.css'
  ]
})

export class SapiViewsCoreAtlasAtlasDropdownSelector implements OnDestroy{

  private subs: Subscription[] = []
  private fetchedAtlases: SapiAtlasModel[] = []
  public fetchedAtlases$: Observable<SapiAtlasModel[]> = this.sapi.atlases$
  public selectedAtlas$: Observable<SapiAtlasModel> = this.store$.pipe(
    select(atlasSelection.selectors.selectedAtlas)
  )

  public SELECT_ATLAS_ARIA_LABEL = ARIA_LABELS.SELECT_ATLAS

  constructor(
    private store$: Store<any>,
    private sapi: SAPI,
  ){
    this.subs.push(
      this.fetchedAtlases$.subscribe(val => this.fetchedAtlases = val)
    )
  }

  ngOnDestroy(): void {
    this.subs.pop().unsubscribe()
  }

  handleChangeAtlas({ value }) {
    const found = this.fetchedAtlases.find(atlas => atlas["@id"] === value)
    if (found) {
      this.store$.dispatch(
        atlasSelection.actions.selectAtlas({
          atlas: found
        })
      )
    } else {
      this.store$.dispatch(
        generalActions.generalActionError({
          message: `Atlas with id ${value} not found.`
        })
      )
    }
  }
}
