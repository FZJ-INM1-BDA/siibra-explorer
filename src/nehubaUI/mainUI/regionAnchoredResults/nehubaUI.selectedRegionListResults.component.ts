import { Component, OnDestroy } from '@angular/core'

import template from './nehubaUI.selectedRegionListResults.template.html'
import { MainController } from 'nehubaUI/nehubaUI.services';
import { RegionDescriptor } from 'nehubaUI/nehuba.model';
import { Subject,Observable } from 'rxjs/Rx';

@Component({
  selector : `selected-region-list`,
  template
})

export class SelectedRegionList implements OnDestroy{
  Object = Object
  selectedRegions : RegionDescriptor[] = []
  destroySubject : Subject<boolean> = new Subject()
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
    return ` <small class = "text-muted">(${region.datasets ?  region.datasets.length : '0'})</small>`
  }
}