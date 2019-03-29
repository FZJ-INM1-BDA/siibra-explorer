import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";
import { Subscription, merge } from "rxjs";
import { DatabrowserService } from "../databrowser.service";
import { ModalityPicker } from "../modalityPicker/modalityPicker.component";

@Component({
  selector : 'data-browser',
  templateUrl : './databrowser.template.html',
  styleUrls : [
    `./databrowser.style.css`
  ]
})

export class DataBrowser implements OnDestroy,OnInit{

  public currentPage: number = 0
  public hitsPerPage: number = 5

  public dataEntries: DataEntry[] = []

  get selectedRegions(){
    return this.dbService.selectedRegions
  }

  get selectedParcellation(){
    return this.dbService.selectedParcellation
  }

  get availableParcellations(){
    return (this.dbService.selectedTemplate && this.dbService.selectedTemplate.parcellations) || []
  }

  get fetchingFlag(){
    return this.dbService.fetchingFlag
  }

  get fetchError(){
    return this.dbService.fetchError
  }

  /**
   * TODO
   * viewport
   * user defined filter
   * etc
   */
  public gemoetryFilter: any

  constructor(
    private dbService: DatabrowserService
  ){

  }

  /**
   * TODO filter types
   */
  public modalityFilter: string[] = []
  private subscriptions : Subscription[] = []

  @ViewChild(ModalityPicker)
  modalityPicker: ModalityPicker

  ngOnInit(){
    this.subscriptions.push(
      merge(
        this.dbService.selectedRegions$,
        this.dbService.fetchDataObservable$
      ).subscribe(() => {
        this.resetCurrentPage()
        /**
         * Only reset modality picker
         * resetting all creates infinite loop
         */
        this.modalityPicker.clearAll()
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

  retryFetchData(event: MouseEvent){
    event.preventDefault()
    this.dbService.manualFetchDataset$.next(null)
  }

  public showParcellationList: boolean = false
  
  deselectRegion(region:any){
    /**
     * when user clicks x on region selector
     */
    
    this.dbService.updateRegionSelection(
      this.selectedRegions.filter(r => r.name !== region.name)
    )
  }

  uncheckModality(modality:string){
    this.modalityPicker.toggleModality({name: modality})
  }

  public filePreviewName: string
  onShowPreviewDataset(payload: {datasetName:string, event:MouseEvent}){
    const { datasetName, event } = payload
    this.filePreviewName = datasetName
  }

  changeParcellation(payload) {
    this.showParcellationList = false
    this.dbService.changeParcellation(payload)
  }

  /**
   * when filter changes, it is necessary to set current page to 0,
   * or one may overflow and see no dataset
   */
  resetCurrentPage(){
    this.currentPage = 0
  }

  resetFilters(event?:MouseEvent){
    event && event.preventDefault()
    this.modalityPicker.clearAll()
    this.dbService.updateRegionSelection([])
  }
}

export interface DataEntryFilter{
  filter: (dataentries:DataEntry[]) => DataEntry[]
}
