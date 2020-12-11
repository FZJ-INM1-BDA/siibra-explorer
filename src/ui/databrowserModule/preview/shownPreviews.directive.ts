import { Directive, Optional, Inject, Output, EventEmitter, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { uiStatePreviewingDatasetFilesSelector } from "src/services/state/uiState/selectors";
import { EnumPreviewFileTypes } from "../pure";
import { switchMap, map, startWith } from "rxjs/operators";
import { forkJoin, of, Subscription } from "rxjs";
import { GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME } from "../pure";
import { viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";

@Directive({
  selector: '[iav-shown-previews]',
  exportAs: 'iavShownPreviews'
})

export class ShownPreviewsDirective implements OnDestroy{

  FILETYPES = EnumPreviewFileTypes

  @Output()
  emitter: EventEmitter<any[]> = new EventEmitter()

  private templateSelected$ = this.store$.pipe(
    select(viewerStateSelectedTemplateSelector)
  )

  public iavAdditionalLayers$ = this.store$.pipe(
    select(uiStatePreviewingDatasetFilesSelector),
    switchMap(prevs => prevs.length > 0
      ? forkJoin(
        prevs.map(prev => this.getDatasetPreviewFromId
          ? this.getDatasetPreviewFromId(prev)
          : of(null)
        )
      )
      : of([])
    ),
    map(arr => arr.filter(item => !!item)),
    startWith([])
  )

  private subscriptions: Subscription[] = []

  constructor(
    private store$: Store<any>,
    @Optional() @Inject(GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME) private getDatasetPreviewFromId
  ){
    this.subscriptions.push(
      this.iavAdditionalLayers$.subscribe(ev => this.emitter.emit(ev))
    )
  }

  ngOnDestroy(){
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}