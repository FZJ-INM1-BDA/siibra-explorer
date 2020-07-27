import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { merge, Observable, Subscription } from "rxjs";
import { LoggingService } from "src/logging";
import { IDataEntry } from "src/services/state/dataStore.store";
import { CountedDataModality, DatabrowserService } from "../databrowser.service";
import { ModalityPicker } from "../modalityPicker/modalityPicker.component";
import { ARIA_LABELS } from 'common/constants.js'
import { DatabrowserBase } from "./databrowser.base";
import { debounceTime } from "rxjs/operators";

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

export class DataBrowser extends DatabrowserBase implements OnChanges, OnDestroy, OnInit {

  @Input()
  disableVirtualScroll: boolean = false

  @Input()
  showList: boolean = true

  public MODALITY_FILTER_ARIA_LABEL = MODALITY_FILTER
  public LIST_OF_DATASETS_ARIA_LABEL = LIST_OF_DATASETS


  /**
   * TODO filter types
   */
  private subscriptions: Subscription[] = []
  public countedDataM: CountedDataModality[] = []
  public visibleCountedDataM: CountedDataModality[] = []

  @ViewChild(ModalityPicker)
  public modalityPicker: ModalityPicker


  /**
   * TODO
   * viewport
   * user defined filter
   * etc
   */
  public gemoetryFilter: any

  constructor(
    private dataService: DatabrowserService,
    private cdr: ChangeDetectorRef,
    log: LoggingService,
  ) {
    super(dataService, log)
  }

  public ngOnChanges() {
    super.ngOnChanges()
  }

  public ngOnInit() {

    this.subscriptions.push(
      this.dataentriesUpdated.pipe(
        debounceTime(60)
      ).subscribe(() => {
        this.countedDataM = this.dataService.getModalityFromDE(this.dataentries)
        this.cdr.markForCheck()
      })
    )
    
    /**
     * TODO gets init'ed everytime when appends to ngtemplateoutlet
     */
    this.dataService.dbComponentInit(this)
    this.subscriptions.push(
      merge(
        // this.dataService.selectedRegions$,
        this.dataService.fetchDataObservable$,
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
