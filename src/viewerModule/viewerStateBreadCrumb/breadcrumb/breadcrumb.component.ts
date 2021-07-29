import { Component, EventEmitter, Output, Pipe, PipeTransform } from "@angular/core";
import { IQuickTourData } from "src/ui/quickTour";
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { select, Store } from "@ngrx/store";
import { viewerStateContextedSelectedRegionsSelector, viewerStateGetOverlayingAdditionalParcellations, viewerStateParcVersionSelector, viewerStateSelectedParcellationSelector } from "src/services/state/viewerState/selectors";
import { distinctUntilChanged, map } from "rxjs/operators";
import { viewerStateHelperSelectParcellationWithId, viewerStateRemoveAdditionalLayer, viewerStateSetSelectedRegions } from "src/services/state/viewerState.store.helper";
import { ngViewerActionClearView, ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState.store.helper";
import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN } from "src/util/interfaces";
import { TDatainfos } from "src/util/siibraApiConstants/types";

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

  public selectedAdditionalLayers$ = this.store$.pipe(
    select(viewerStateGetOverlayingAdditionalParcellations),
  )

  public parcellationSelected$ = this.store$.pipe(
    select(viewerStateSelectedParcellationSelector),
    distinctUntilChanged(),
  )

  public selectedRegions$ = this.store$.pipe(
    select(viewerStateContextedSelectedRegionsSelector),
    distinctUntilChanged(),
  )

  public selectedLayerVersions$ = this.store$.pipe(
    select(viewerStateParcVersionSelector),
    map(arr => arr.map(item => {
      const overwrittenName = item['@version'] && item['@version']['name']
      return overwrittenName
        ? { ...item, displayName: overwrittenName }
        : item
    }))
  )


  constructor(private store$: Store<any>){

  }

  handleChipClick(){
    this.onChipClick.emit(null)
  }

  public clearSelectedRegions(){
    this.store$.dispatch(
      viewerStateSetSelectedRegions({
        selectRegions: []
      })
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
      viewerStateRemoveAdditionalLayer({
        payload: layer
      })
    )
  }

  public selectParcellation(parc: any) {
    this.store$.dispatch(
      viewerStateHelperSelectParcellationWithId({
        payload: parc
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

@Pipe({
  name: 'originalDatainfoPriorityPipe'
})

export class OriginalDatainfoPipe implements PipeTransform{
  public transform(originalDatainfo: TDatainfos[]): TDatainfos[]{
    if (originalDatainfo.some(info => info.urls.length > 0)) {
      return originalDatainfo.filter(info => info.urls.length > 0)
    }
    return originalDatainfo.slice(0,1)
  }
}
