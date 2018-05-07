import { Component, AfterViewInit, OnDestroy } from '@angular/core'

import template from './nehubaUI.regionAnchoredResults.template.html'
import css from './nehubaUI.regionAnchoredResults.style.css'
import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';
import { MainController, TEMP_SearchDatasetService, MasterCollapsableController } from 'nehubaUI/nehubaUI.services';
import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';
import { Subject,Observable } from 'rxjs/Rx';
import { ParcellationDescriptor } from 'nehubaUI/nehuba.model';

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
  filterSearchResultbyType : {name : string, enabled : boolean}[] = []

  constructor(private mainController:MainController,private searchDatasetService:TEMP_SearchDatasetService,public collapsableContoller:MasterCollapsableController){
    Observable
      .from(this.mainController.selectedRegionsBSubject)
      .takeUntil(this.onDestroySubject)
      .debounceTime(150)
      .subscribe(srds=>{
        this.renderRegionFilter = srds.length != 0
        this.renderFullList = srds.length == 0
      })
  }

  ngOnDestroy(){
    this.onDestroySubject.next(true)
  }

  ngAfterViewInit(){
    Observable
      .combineLatest(this.searchDatasetService.returnedSearchResultsBSubject,this.mainController.selectedParcellationBSubject)
      .takeUntil(this.onDestroySubject)
      .subscribe((val)=>{
        this.searchResultObjects = (val[1] && (val[1] as ParcellationDescriptor).name == 'JuBrain Cytoarchitectonic Atlas') ?
          val[0] : 
          []

        this.filterSearchResultbyType = this.searchResultObjects.reduce((acc,curr)=>{
          const idx = acc.findIndex(it=>it.name===curr.type)
          return idx >= 0 ? acc : acc.concat({name : curr.type , enabled : true})
        },[] as {name:string,enabled:boolean}[])
      })
  }

  getTypeMetadata(type:string){
    return this.searchDatasetService.searchResultMetadataMap.get(type)
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
  }

  collapseAll(){
    this.collapsableContoller.expandBSubject.next(false)
  }

  expandAll(){
    this.collapsableContoller.expandBSubject.next(true)
  }

  clearAllSelectedRegions(){
    this.mainController.selectedRegionsBSubject.next([])
  }

  get selectedRegionsLength(){
    return this.mainController.selectedRegionsBSubject.getValue().length
  }
}