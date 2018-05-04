import { Component, OnDestroy, Input, ViewChildren } from '@angular/core'

import template from './nehubaUI.selectedRegionListResults.template.html'
import { MainController, MasterCollapsableController } from 'nehubaUI/nehubaUI.services';
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

  constructor(public mainController:MainController,private collapseableController:MasterCollapsableController ){
    Observable
      .from(this.mainController.selectedRegionsBSubject)
      .takeUntil(this.destroySubject)
      .subscribe(regions=>this.selectedRegions=regions)

    Observable
      .from(this.collapseableController.expandBSubject)
      .takeUntil(this.destroySubject)
      .subscribe(bool=>{
        this.collapsablePanels.forEach(cp=>bool ? cp.show() : cp.hide())
      })
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