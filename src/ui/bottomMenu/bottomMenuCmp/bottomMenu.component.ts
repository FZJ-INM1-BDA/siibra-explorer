import { Component, EventEmitter, HostBinding, Output } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { combineLatest } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { MainState, atlasSelection, userInteraction } from "src/state";

@Component({
  selector: 'sxplr-bottom-menu',
  templateUrl: `./bottomMenu.template.html`,
  styleUrls: [
    `./bottomMenu.style.scss`
  ],
})

export class BottomMenuCmp{

  @HostBinding('attr.data-menu-open')
  menuOpen: 'some'|'all'|'none' = null

  @Output()
  onRegionClick = new EventEmitter<void>()

  #selectedATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP()
  )
  #selectedRegions$ = this.store.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )
  #selectedFeature$ = this.store.pipe(
    select(userInteraction.selectors.selectedFeature)
  )

  view$ = combineLatest([
    this.#selectedATP$,
    this.#selectedRegions$,
    this.#selectedFeature$,
  ]).pipe(
    map(([ { atlas, parcellation, template }, selectedRegions, selectedFeature ]) => {
      return {
        selectedAtlas: atlas,
        selectedParcellation: parcellation,
        selectedTemplate: template,
        selectedRegions,
        selectedFeature
      }
    }),
    shareReplay(1)
  )

  constructor(private store: Store<MainState>){}

  clearRoi(){
    this.store.dispatch(
      atlasSelection.actions.clearSelectedRegions()
    )
  }

  clearFeature(){
    this.store.dispatch(
      userInteraction.actions.clearShownFeature()
    )
  }

  onATPMenuOpen(opts: { all: boolean, some: boolean, none: boolean }){
    if (opts.all) {
      this.menuOpen = 'all'
    }
    if (opts.some) {
      this.menuOpen = 'some'
    }
    if (opts.none) {
      this.menuOpen = 'none'
    }
  }
}
