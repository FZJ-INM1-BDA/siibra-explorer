import { Component, OnDestroy, OnInit, ViewChild, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, Output,EventEmitter, TemplateRef } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";
import { Subscription, merge, Observable } from "rxjs";
import { DatabrowserService, CountedDataModality } from "../databrowser.service";
import { ModalityPicker } from "../modalityPicker/modalityPicker.component";
import { MatDialog } from "@angular/material";
import { KgSingleDatasetService } from "../kgSingleDatasetService.service";
import { scan, shareReplay } from "rxjs/operators";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";

const scanFn: (acc: any[], curr: any) => any[] = (acc, curr) => [curr, ...acc]

@Component({
  selector : 'data-browser',
  templateUrl : './databrowser.template.html',
  styleUrls : [
    `./databrowser.style.css`
  ],
  exportAs: 'dataBrowser',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DataBrowser implements OnChanges, OnDestroy,OnInit{

  @Input()
  public regions: any[] = []

  @Input()
  public template: any
  
  @Input()
  public parcellation: any

  @Output()
  dataentriesUpdated: EventEmitter<DataEntry[]> = new EventEmitter()

  public dataentries: DataEntry[] = []
  public focusedDataset: DataEntry

  public currentPage: number = 0
  public hitsPerPage: number = 5

  public fetchingFlag: boolean = false
  public fetchError: boolean = false
  /**
   * TODO filter types
   */
  private subscriptions : Subscription[] = []
  public countedDataM: CountedDataModality[] = []
  public visibleCountedDataM: CountedDataModality[] = []

  public history$: Observable<{file:ViewerPreviewFile, dataset: DataEntry}[]>

  @ViewChild(ModalityPicker)
  modalityPicker: ModalityPicker

  @ViewChild('detailDataset', {read: TemplateRef})
  detailDatasetTemplateRef: TemplateRef<any>

  public favDataentries$: Observable<DataEntry[]>

  get darktheme(){
    return this.dbService.darktheme
  }

  /**
   * TODO
   * viewport
   * user defined filter
   * etc
   */
  public gemoetryFilter: any

  constructor(
    private dbService: DatabrowserService,
    private cdr:ChangeDetectorRef,
    private dialog: MatDialog,
    private singleDatasetSservice: KgSingleDatasetService
  ){
    this.favDataentries$ = this.dbService.favedDataentries$
    this.history$ = this.singleDatasetSservice.previewingFile$.pipe(
      scan(scanFn, []),
      shareReplay(1)
    )
  }

  ngOnChanges(changes){

    this.regions = this.regions.map(r => {
      /**
       * TODO to be replaced with properly region UUIDs from KG
       */
      return {
        id: `${this.parcellation.name}/${r.name}`,
        ...r
      }
    })
    const { regions, parcellation, template } = this
    this.fetchingFlag = true

    /**
     * reconstructing parcellation region is async (done on worker thread)
     * if parcellation region is not yet defined, return. 
     * parccellation will eventually be updated with the correct region
     */
    if (!parcellation.regions) return
    
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
        console.error(e)
        this.fetchError = true
      })
      .finally(() => {
        this.fetchingFlag = false
        this.dataentriesUpdated.emit(this.dataentries)
        this.cdr.markForCheck()
      })

  }

  ngOnInit(){
    /**
     * TODO gets init'ed everytime when appends to ngtemplateoutlet 
     */
    this.dbService.dbComponentInit(this)
    this.subscriptions.push(
      merge(
        // this.dbService.selectedRegions$,
        this.dbService.fetchDataObservable$
      ).subscribe(() => {
        this.resetCurrentPage()
        /**
         * Only reset modality picker
         * resetting all creates infinite loop
         */
        this.clearAll()
      })
    )
    
    /**
     * TODO fix
     */
    // this.subscriptions.push(
    //   this.filterApplied$.subscribe(() => this.currentPage = 0)
    // )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }

  clearAll(){
    this.countedDataM = this.countedDataM.map(cdm => {
      return {
        ...cdm,
        visible: false
      }
    })
    this.visibleCountedDataM = []
    this.resetCurrentPage()
  }

  handleModalityFilterEvent(modalityFilter:CountedDataModality[]){
    this.countedDataM = modalityFilter
    this.visibleCountedDataM = modalityFilter.filter(dm => dm.visible)
    this.resetCurrentPage()
  }

  retryFetchData(event: MouseEvent){
    event.preventDefault()
    this.dbService.manualFetchDataset$.next(null)
  }

  toggleFavourite(dataset: DataEntry){
    this.dbService.toggleFav(dataset)
  }

  saveToFavourite(dataset: DataEntry){
    this.dbService.saveToFav(dataset)
  }

  removeFromFavourite(dataset: DataEntry){
    this.dbService.removeFromFav(dataset)
  }

  public showParcellationList: boolean = false
  
  public filePreviewName: string
  onShowPreviewDataset(payload: {datasetName:string, event:MouseEvent}){
    const { datasetName, event } = payload
    this.filePreviewName = datasetName
  }

  /**
   * when filter changes, it is necessary to set current page to 0,
   * or one may overflow and see no dataset
   */
  resetCurrentPage(){
    this.currentPage = 0
  }

  resetFilters(event?:MouseEvent){
    this.clearAll()
  }

  showFocusedDataset(dataset:DataEntry){
    this.focusedDataset = dataset
    this.dialog.open(this.detailDatasetTemplateRef)
  }
}

export interface DataEntryFilter{
  filter: (dataentries:DataEntry[]) => DataEntry[]
}
