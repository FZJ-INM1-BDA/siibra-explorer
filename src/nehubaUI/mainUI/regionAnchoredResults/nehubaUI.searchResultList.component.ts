import {Component, AfterViewInit, OnDestroy} from '@angular/core'
import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';
import { TEMP_SearchDatasetService } from 'nehubaUI/nehubaUI.services';
import { Subject,Observable } from 'rxjs/Rx';
import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './nehubaUI.searchResultList.template.html'

@Component({
  selector : 'nehubaui-searchresult-ui-list',
  template ,
  animations : [ animationFadeInOut ]
})
export class SearchResultUIList implements AfterViewInit, OnDestroy{
  constructor( public searchDatasetService:TEMP_SearchDatasetService ){
    this.onDestroySubject = new Subject()
  }

  onDestroySubject : Subject<any>
  
  searchResultObjects : SearchResultInterface[] = []

  ngAfterViewInit(){
    /* need to check if this logic works */
    Observable
      .from(this.searchDatasetService.returnedSearchResultsBSubject)
      .takeUntil(this.onDestroySubject)
      .subscribe(searchResultArray=>{
        this.searchResultObjects = searchResultArray
      })
    
  }

  ngOnDestroy(){
    this.onDestroySubject.next(true)
  }
}