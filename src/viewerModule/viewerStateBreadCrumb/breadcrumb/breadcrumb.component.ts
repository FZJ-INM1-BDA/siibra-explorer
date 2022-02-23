import { Component, EventEmitter, Output } from "@angular/core";
import { IQuickTourData } from "src/ui/quickTour";
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { select, Store } from "@ngrx/store";
import { distinctUntilChanged, map } from "rxjs/operators";
import { ngViewerActionClearView, ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState.store.helper";
import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN } from "src/util/interfaces";
import { atlasSelection } from "src/state"
import { NEVER, of } from "rxjs";
import { SapiParcellationModel } from "src/atlasComponents/sapi";

@Component({
  selector: 'viewer-state-breadcrumb',
  templateUrl: './breadcrumb.template.html',
  styleUrls: [
    './breadcrumb.style.css'
  ],
  providers: [
    {
      provide: OVERWRITE_SHOW_DATASET_DIALOG_TOKEN,
      useValue: null
    }
  ]
})

export class ViewerStateBreadCrumb {

  public CONST = CONST
  public ARIA_LABELS = ARIA_LABELS

  @Output('on-item-click')
  onChipClick = new EventEmitter()

  public quickTourChips: IQuickTourData = {
    order: 5,
    description: QUICKTOUR_DESC.CHIPS,
  }

  public clearViewKeys$ = this.store$.pipe(
    select(ngViewerSelectorClearViewEntries)
  )

  // TODO what is this observable anyway?
  public selectedAdditionalLayers$ = of([])

  public parcellationSelected$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedParcellation),
    distinctUntilChanged(),
    
  )

  public selectedRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions),
    distinctUntilChanged(),
  )

  // TODO add version info in siibra-api/siibra-python
  public selectedLayerVersions$ = NEVER

  constructor(private store$: Store<any>){
  }

  handleChipClick(){
    this.onChipClick.emit(null)
  }

  public clearSelectedRegions(){
    this.store$.dispatch(
      atlasSelection.actions.clearSelectedRegions()
    )
  }

  public unsetClearViewByKey(key: string){
    this.store$.dispatch(
      ngViewerActionClearView({ payload: {
        [key]: false
      }})
    )
  }

  public clearAdditionalLayer(layer: { ['@id']: string }){
    this.store$.dispatch(
      atlasSelection.actions.clearNonBaseParcLayer()
    )
  }

  public selectParcellationWithId(parcId: string) {
    this.store$.dispatch(
      atlasSelection.actions.selectATPById({
        parcellationId: parcId
      })
    )
  }

  public bindFns(fns){
    return () => {
      for (const [ fn, ...arg] of fns) {
        fn(...arg)
      }
    }
  }

}
