import {Component, AfterViewInit, OnDestroy} from '@angular/core'
import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';
import { TEMP_SearchDatasetService, MainController } from 'nehubaUI/nehubaUI.services';
import { Subject,Observable } from 'rxjs/Rx';
import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './nehubaUI.searchResultList.template.html'
import { ParcellationDescriptor } from 'nehubaUI/nehuba.model';

@Component({
  selector : 'nehubaui-searchresult-ui-list',
  template ,
  animations : [ animationFadeInOut ]
})
export class SearchResultUIList implements AfterViewInit, OnDestroy{
  constructor( private mainController : MainController,private searchDatasetService:TEMP_SearchDatasetService ){
    this.onDestroySubject = new Subject()
  }

  onDestroySubject : Subject<any>
  
  searchResultObjects : SearchResultInterface[] = []

  ngAfterViewInit(){
    /* need to check if this logic works */
    Observable
      .combineLatest(this.searchDatasetService.returnedSearchResultsBSubject,this.mainController.selectedParcellationBSubject)
      .takeUntil(this.onDestroySubject)
      .subscribe((val)=>{
        this.searchResultObjects = (val[1] && (val[1] as ParcellationDescriptor).name == 'JuBrain Cytoarchitectonic Atlas') ?
          val[0] : 
          []
      })
    
  }

  ngOnDestroy(){
    this.onDestroySubject.next(true)
  }
}