import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { merge, Observable, Subscription } from "rxjs";
import { LoggingService } from "src/logging";
import { IDataEntry } from "src/services/stateStore.service";
import { CountedDataModality, DatabrowserService } from "../databrowser.service";
import { ModalityPicker } from "../modalityPicker/modalityPicker.component";
import { ARIA_LABELS } from 'common/constants.js'

const { MODALITY_FILTER, LIST_OF_DATASETS } = ARIA_LABELS

@Component({
  selector : 'data-browser',
  templateUrl : './databrowser.template.html',
  styleUrls : [
    `./databrowser.style.css`,
  ],
  exportAs: 'dataBrowser',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DataBrowser implements OnChanges, OnDestroy, OnInit {

  @Input()
  showList: boolean = true

  public MODALITY_FILTER_ARIA_LABEL = MODALITY_FILTER
  public LIST_OF_DATASETS_ARIA_LABEL = LIST_OF_DATASETS
  @Input()
  public regions: any[] = []

  @Input()
  public template: any

  @Input()
  public parcellation: any

  @Output()
  public dataentriesUpdated: EventEmitter<IDataEntry[]> = new EventEmitter()

  public dataentries: IDataEntry[] = []

  public fetchingFlag: boolean = false
  public fetchError: boolean = false
  /**
   * TODO filter types
   */
  private subscriptions: Subscription[] = []
  public countedDataM: CountedDataModality[] = []
  public visibleCountedDataM: CountedDataModality[] = []

  @ViewChild(ModalityPicker)
  public modalityPicker: ModalityPicker

  public favDataentries$: Observable<Partial<IDataEntry>[]>

  /**
   * TODO
   * viewport
   * user defined filter
   * etc
   */
  public gemoetryFilter: any

  constructor(
    private dbService: DatabrowserService,
    private cdr: ChangeDetectorRef,
    private log: LoggingService,
  ) {
    this.favDataentries$ = this.dbService.favedDataentries$
  }

  public ngOnChanges() {

    this.regions = this.regions.map(r => {
      /**
       * TODO to be replaced with properly region UUIDs from KG
       */
      return {
        id: `${this.parcellation?.name || 'untitled_parcellation'}/${r.name}`,
        ...r,
      }
    })
    const { regions, parcellation, template } = this
    this.fetchingFlag = true

    // input may be undefined/null
    if (!parcellation) { return }

    /**
     * reconstructing parcellation region is async (done on worker thread)
     * if parcellation region is not yet defined, return.
     * parccellation will eventually be updated with the correct region
     */
    if (!parcellation.regions) { return }

    this.dbService.getDataByRegion({ regions, parcellation, template })
      .then(de => {
        this.dataentries = de
        return de
      })
      .then(this.dbService.getModalityFromDE)
      .then(modalities => {
        this.countedDataM = modalities
      })
      .catch(e => {
        this.log.error(e)
        this.fetchError = true
      })
      .finally(() => {
        this.fetchingFlag = false
        this.dataentriesUpdated.emit(this.dataentries)
        this.cdr.markForCheck()
      })

  }

  public ngOnInit() {
    /**
     * TODO gets init'ed everytime when appends to ngtemplateoutlet
     */
    this.dbService.dbComponentInit(this)
    this.subscriptions.push(
      merge(
        // this.dbService.selectedRegions$,
        this.dbService.fetchDataObservable$,
      ).subscribe(() => {
        /**
         * Only reset modality picker
         * resetting all creates infinite loop
         */
        this.clearAll()
      }),
    )

    /**
     * TODO fix
     */
    // this.subscriptions.push(
    //   this.filterApplied$.subscribe(() => this.currentPage = 0)
    // )
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public clearAll() {
    this.countedDataM = this.countedDataM.map(cdm => {
      return {
        ...cdm,
        visible: false,
      }
    })
    this.visibleCountedDataM = []
  }

  public handleModalityFilterEvent(modalityFilter: CountedDataModality[]) {
    this.countedDataM = modalityFilter
    this.visibleCountedDataM = modalityFilter.filter(dm => dm.visible)
    this.cdr.markForCheck()
  }

  public retryFetchData(event: MouseEvent) {
    event.preventDefault()
    this.dbService.manualFetchDataset$.next(null)
  }

  public toggleFavourite(dataset: IDataEntry) {
    this.dbService.toggleFav(dataset)
  }

  public saveToFavourite(dataset: IDataEntry) {
    this.dbService.saveToFav(dataset)
  }

  public removeFromFavourite(dataset: IDataEntry) {
    this.dbService.removeFromFav(dataset)
  }

  public showParcellationList: boolean = false

  public filePreviewName: string
  public onShowPreviewDataset(payload: {datasetName: string, event: MouseEvent}) {
    const { datasetName } = payload
    this.filePreviewName = datasetName
  }

  public resetFilters(_event?: MouseEvent) {
    this.clearAll()
  }

  public trackByFn(index: number, dataset: IDataEntry) {
    return dataset.id
  }
}

export interface IDataEntryFilter {
  filter: (dataentries: IDataEntry[]) => IDataEntry[]
}
