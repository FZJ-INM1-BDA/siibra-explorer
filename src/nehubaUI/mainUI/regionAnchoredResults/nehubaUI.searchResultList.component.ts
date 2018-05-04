import {Component, Pipe, PipeTransform, Input, OnChanges} from '@angular/core'
// import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';


import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './nehubaUI.searchResultList.template.html'
import css from './nehubaUI.searchResultList.style.css'

@Component({
  selector : 'nehubaui-searchresult-ui-list',
  template ,
  styles : [
    css
  ],
  /* fade animation is more trouble and it's worth */
  // animations : [ animationFadeInOut ]
})
export class SearchResultUIList implements OnChanges{
  
  @Input() searchResultObjects : SearchResultInterface[] = []
  @Input() filterSearchResultbyType : {name : string, enabled : boolean}[] = []

  ngOnChanges(){
    this.currentPage = Math.max(0,Math.min(this.currentPage,Math.ceil(this.total / this.hitsPerPage) - 1))
  }

  currentPage : number = 0
  hitsPerPage : number = 15
  get total(){
    const newFilterDatasetSearchResult = new FilterDatasetSearchResult()
    return newFilterDatasetSearchResult.transform( this.searchResultObjects,this.filterSearchResultbyType ).length
  }
  paginationChange(pgnum:number){
    this.currentPage = pgnum
  }
}

@Pipe({
  name : 'searchResultPagination'
})

export class SearchResultPaginationPipe implements PipeTransform{
  private _hitsPerPage:number = 15
  private _pageNumber:number = 0
  public transform(arr:any[],pageNumber?:number,hitsPerPage?:number){
    return arr.filter((_,idx)=>
      (idx >= (pageNumber === undefined ? this._pageNumber : pageNumber) * (hitsPerPage === undefined ? this._hitsPerPage : hitsPerPage)) &&
      idx < ((pageNumber === undefined ? this._pageNumber : pageNumber) + 1) * (hitsPerPage === undefined ? this._hitsPerPage : hitsPerPage))
  }
}

@Pipe({
  name : 'filterDatasetSearchResult'
})

export class FilterDatasetSearchResult implements PipeTransform{
  public transform(datasets:SearchResultInterface[],filterArr:{name:string,enabled:boolean}[]):SearchResultInterface[]{
    return datasets.filter(dataset=>{
      const filter = filterArr.find(obj=>obj.name == dataset.type)
      return filter ? filter.enabled : false
    })
  }
}