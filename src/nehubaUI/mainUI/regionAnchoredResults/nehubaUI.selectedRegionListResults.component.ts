import { Component, OnDestroy, Input, ViewChildren, PipeTransform, Pipe } from '@angular/core'

import template from './nehubaUI.selectedRegionListResults.template.html'
import { MainController } from 'nehubaUI/nehubaUI.services';
import { RegionDescriptor } from 'nehubaUI/nehuba.model';
import { Subject,Observable } from 'rxjs/Rx';

import css from './nehubaUI.selectedRegionListResults.style.css'
import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';
import { FilterDatasetSearchResult } from 'nehubaUI/mainUI/regionAnchoredResults/nehubaUI.searchResultList.component';
import { CollapsablePanel } from 'nehubaUI/components/collapsablePanel/nehubaUI.collapsablePanel.component';

@Component({
  selector : `selected-region-list`,
  template ,
  styles : [
    css
  ]
})

export class SelectedRegionList implements OnDestroy{
  Object = Object
  selectedRegions : RegionDescriptor[] = []
  destroySubject : Subject<boolean> = new Subject()

  @Input() searchResultObjects : SearchResultInterface[] = []
  @Input() filterSearchResultbyType : {name : string, enabled : boolean}[] = []
  @ViewChildren(CollapsablePanel) collapsablePanels : CollapsablePanel[] = []

  constructor(public mainController:MainController){
    Observable
      .from(this.mainController.selectedRegionsBSubject)
      .takeUntil(this.destroySubject)
      .subscribe(regions=>this.selectedRegions=regions.slice())

  }

  ngOnDestroy(){
    this.destroySubject.next(true)
  }
  onDismiss(region:any){
    this.mainController.selectedRegionsBSubject.next(
      this.mainController.selectedRegions.filter(re=>re!==region)
    )
  }
  renderRegionDatasetCount(region:RegionDescriptor){
    const pipe = new FilterDatasetSearchResult()
    return ` <small class = "text-muted">(${region.datasets ? pipe.transform(region.datasets,this.filterSearchResultbyType).length : '0'})</small>`
  }

  renderRegionName(region:RegionDescriptor){
    const pipe = new FilterDatasetSearchResult()
    return pipe.transform(region.datasets,this.filterSearchResultbyType).length > 0 ? 
      `<span>${region.name}${this.renderRegionDatasetCount(region)}</span>`:
      `<del class = "text-muted">${region.name}${this.renderRegionDatasetCount(region)}</del>` 
  }
}

@Pipe({
  name : 'filterRegionByDatasetCount'
})

export class FilterRegionsByDatasetCount implements PipeTransform{
  
  public transform(regions:RegionDescriptor[],searchResultInterface:{name : string, enabled : boolean}[]){

    const pipe = new FilterDatasetSearchResult()
    const filteredRegions = regions.filter(re=>pipe.transform(re.datasets,searchResultInterface).length > 0)
    return filteredRegions
  }
}