import { Component, OnDestroy, Input } from '@angular/core'

import template from './nehubaUI.selectedRegionListResults.template.html'
import { MainController } from 'nehubaUI/nehubaUI.services';
import { RegionDescriptor } from 'nehubaUI/nehuba.model';
import { Subject,Observable } from 'rxjs/Rx';

import css from './nehubaUI.selectedRegionListResults.style.css'
import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';
import { FilterDatasetSearchResult } from 'nehubaUI/mainUI/regionAnchoredResults/nehubaUI.searchResultList.component';

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

  constructor(public mainController:MainController){
    Observable
      .from(this.mainController.selectedRegionsBSubject)
      .takeUntil(this.destroySubject)
      .subscribe(regions=>this.selectedRegions=regions)
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
}