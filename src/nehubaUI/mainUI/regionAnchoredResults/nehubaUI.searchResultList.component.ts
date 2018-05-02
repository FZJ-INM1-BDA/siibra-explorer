import {Component, AfterViewInit, OnDestroy, Pipe, PipeTransform} from '@angular/core'
// import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';
import { TEMP_SearchDatasetService, MainController } from 'nehubaUI/nehubaUI.services';
import { Subject,Observable } from 'rxjs/Rx';
import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './nehubaUI.searchResultList.template.html'
import css from './nehubaUI.searchResultList.style.css'
import { ParcellationDescriptor } from 'nehubaUI/nehuba.model';

@Component({
  selector : 'nehubaui-searchresult-ui-list',
  template ,
  styles : [
    css
  ],
  /* fade animation is more trouble and it's worth */
  // animations : [ animationFadeInOut ]
})
export class SearchResultUIList implements AfterViewInit, OnDestroy{
  constructor( private mainController : MainController,private searchDatasetService:TEMP_SearchDatasetService ){
    this.onDestroySubject = new Subject()
  }

  onDestroySubject : Subject<any>
  searchResultObjects : SearchResultInterface[] = []
  filterSearchResultbyType : {name : string, enabled : boolean}[] = []

  ngAfterViewInit(){
    /* need to check if this logic works */
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

  ngOnDestroy(){
    this.onDestroySubject.next(true)
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