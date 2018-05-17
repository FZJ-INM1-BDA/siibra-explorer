import { Component, AfterViewInit, OnDestroy } from '@angular/core'

import template from './nehubaUI.regionAnchoredResults.template.html'
import css from './nehubaUI.regionAnchoredResults.style.css'
import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';
import { MainController, TEMP_SearchDatasetService, MasterCollapsableController, LandmarkServices, SpatialSearch } from 'nehubaUI/nehubaUI.services';
import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';
import { Subject,Observable } from 'rxjs/Rx';

@Component({
  selector : `region-anchored-results`,
  template,
  styles : [
    css
  ],
  animations : [ animationFadeInOut ],
  providers : [ MasterCollapsableController ]
})

export class RegionAnchoredResults implements AfterViewInit,OnDestroy{
  viewList : boolean = true
  
  renderFullList : boolean = false
  renderRegionFilter : boolean = false

  onDestroySubject : Subject<any> = new Subject()

  searchResultObjects : SearchResultInterface[] = []
  spatialSearchResultObjects : SearchResultInterface[] = []
  filterSearchResultbyType : {name : string, enabled : boolean}[] = []

  spatialHitsPerPage : number = 10
  spatialTotal : number = 10
  spatialPagination : number = 0

  TEMP_ieegDictionary : any = {}
  TEMP_returnIeegEntries : (dataset:SearchResultInterface) => any = (dataset:SearchResultInterface)=>{
    return dataset.id in this.TEMP_ieegDictionary ? ({
      name : `iEEG recording site: ${this.TEMP_ieegDictionary[dataset.id].id}`,
      thumbnail : {
        properties : {},
        filename : 'thumbnail',
        name : 'Link to KG',
        mimetype : 'application/octet-stream',
        url : this.TEMP_ieegDictionary[dataset.id].fileName,
        parentDataset : dataset
      },
      files : []
    }) : ({

    })
  }

  constructor(
    private mainController:MainController,
    private searchDatasetService:TEMP_SearchDatasetService,
    public collapsableContoller:MasterCollapsableController,
    private landmarkService:LandmarkServices,
    private spatialSearch :SpatialSearch
  ){
    Observable
      .from(this.mainController.selectedRegionsBSubject)
      .takeUntil(this.onDestroySubject)
      .debounceTime(150)
      .subscribe(srds=>{
        this.renderRegionFilter = srds.length != 0
        this.renderFullList = srds.length == 0
      })

    this.updateSpatialPagination()

    /* TODO temp fetching ieeg data */
    fetch('res/json/ieegTable.json')
      .then(res=>res.json())
      .then(json=>this.TEMP_ieegDictionary = json)
  }

  private updateSpatialPagination(){
    this.spatialHitsPerPage = this.spatialSearch.RESULTS_PER_PAGE
    this.spatialTotal = this.spatialSearch.numHits
    this.spatialPagination = this.spatialSearch.pagination
  }

  spatialPaginationChange(pg:number){
    this.spatialSearch.goTo(pg)
  }

  ngOnDestroy(){
    this.onDestroySubject.next(true)
  }

  ngAfterViewInit(){

    /* when user toggle between parcellations, reset the filtersearchresult */
    Observable
      .from(this.mainController.selectedParcellationBSubject)
      .subscribe(()=>{
        this.filterSearchResultbyType = []
      })

    Observable
      .from(this.searchDatasetService.returnedSearchResultsBSubject)
      .takeUntil(this.onDestroySubject)
      .debounceTime(300)
      .subscribe((val)=>{
        this.searchResultObjects = val

        // TODO  will have to decide if splitting returnedsearchresultobject into spatial and normal there are raminfication here
        this.addToFilterSearchResultbyType(this.searchResultObjects)
      })

    Observable
      .from(this.searchDatasetService.returnedSpatialSearchResultsBSubject)
      .takeUntil(this.onDestroySubject)
      .debounceTime(300)
      .map(arr=>
        arr.map(it=>
          Object.assign({},it,this.TEMP_returnIeegEntries(it))))
      .subscribe(val=>{
        this.spatialSearchResultObjects = val

        this.updateSpatialPagination()

        // TODO  will have to decide if splitting returnedsearchresultobject into spatial and normal there are raminfication here
        this.addToFilterSearchResultbyType(this.spatialSearchResultObjects)
      })
  }

  get showSpatialSearch(){
    const it = this.filterSearchResultbyType.find(v=>v.name === 'Spatial Search Result')
    return it ? it.enabled : false
  }

  get spatialSearchResultPanelTitle(){
    return `Spatial Search Result <small class = "text-muted">(${this.spatialTotal})</small>`
  }

  private addToFilterSearchResultbyType(searchresults:SearchResultInterface[]){
    const condensedList = searchresults.reduce((acc,curr)=>{
      const idx = acc.findIndex(it=>it.name == curr.type)
      return idx >= 0 ? acc : acc.concat({name : curr.type ,  enabled : true})
    },[] as {name:string,enabled:boolean}[])

    this.filterSearchResultbyType = condensedList.reduce((acc,curr)=>{
      const idx = acc.findIndex(it=>it.name == curr.name)
      return idx >= 0 ? acc : acc.concat(curr)
    },this.filterSearchResultbyType)
  }

  getTypeMetadata(type:string){
    const parcellation = this.mainController.selectedParcellationBSubject.getValue()
    const parcellationName = parcellation ? parcellation.name : ''
    return this.searchDatasetService.searchResultMetadataMap.get({targetParcellation:parcellationName,datasetName:type})
  }
  
  animationDone(){
    if(this.viewList)this.renderFullList = true
    else this.renderRegionFilter = true
  }

  fadeOut(){
    this.viewList ? this.renderRegionFilter = false : this.renderFullList = false
  }

  fadeIn(){
    this.viewList ? this.renderFullList = true : this.renderRegionFilter = true
  }

  toggleEnable(type:{name:string,enabled:boolean}){
    this.filterSearchResultbyType = this.filterSearchResultbyType.reduce((acc,curr)=>{
      return curr.name == type.name ? 
        acc.concat({
          name : type.name,
          enabled : !type.enabled
        }) :
        acc.concat(curr)
    },[] as {name:string,enabled:boolean}[])

    this.mainController.resultsFilterBSubject.next(
      this.filterSearchResultbyType.filter(v=>!v.enabled).map(v=>v.name)
    )
  }

  collapseAll(){
    this.collapsableContoller.expandBSubject.next(false)
  }

  expandAll(){
    this.collapsableContoller.expandBSubject.next(true)
  }

  mouseoverSpatialSearch(searchResultObject:SearchResultInterface){
    const idx = this.landmarkService.landmarks.findIndex(lm=>lm.id === searchResultObject.id)
    if(idx >= 0){
      this.landmarkService.TEMP_vtkHighlight(idx)
      this.landmarkService.landmarks[idx].hover = true
    }
  }

  mouseoutSpatialSearch(_searchResultObject:any){
    this.landmarkService.landmarks.forEach(lm=>lm.hover = false)
    this.landmarkService.TEMP_clearVtkHighlight()
  }

  clearAllSelectedRegions(){
    this.mainController.selectedRegionsBSubject.next([])
  }

  get selectedRegionsLength(){
    return this.mainController.selectedRegionsBSubject.getValue().length
  }
}