import {Component, Pipe, PipeTransform, Input, OnChanges} from '@angular/core'
// import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';


import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './nehubaUI.searchResultList.template.html'
import css from './nehubaUI.searchResultList.style.css'
import { RegionDescriptor } from 'nehubaUI/nehuba.model';
import { MainController } from 'nehubaUI/nehubaUI.services';

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

  allLabelledRegions : RegionDescriptor[] = []

  constructor(private mainController:MainController){
    this.allLabelledRegions = Array.from(this.mainController.regionsLabelIndexMap.values())
  }

  ngOnChanges(){
    this.currentPage = Math.max(0,Math.min(this.currentPage,Math.ceil(this.total / this.hitsPerPage) - 1))
  }

  renderRegionName(obj:{region:RegionDescriptor|null,searchResult:SearchResultInterface[]}){
    return `${obj.region ? obj.region.name : 'Unlinked to any region'} <small class = "text-muted">(${obj.searchResult.length})</small>`
  }

  currentPage : number = 0
  hitsPerPage : number = 15
  get total(){
    // const newFilterDatasetSearchResult = new FilterDatasetSearchResult()
    const groupDatasetByRegion = new GroupDatasetByRegion()
    return groupDatasetByRegion.transform( this.searchResultObjects,this.filterSearchResultbyType,this.allLabelledRegions ).length
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

@Pipe({
  name : 'groupDatasetByRegion'
})
export class GroupDatasetByRegion implements PipeTransform{
  public transform(datasets:SearchResultInterface[],filterArr:{name:string,enabled:boolean}[],regions:RegionDescriptor[]):{region:RegionDescriptor|null,searchResult:SearchResultInterface[]}[]{
    const pipe = new FilterDatasetSearchResult()
    const filteredSearchresults = pipe.transform(datasets,filterArr)
    
    return filteredSearchresults.reduce((acc,curr)=>{
      return (curr.regionName && curr.regionName.length > 0) ?
        curr.regionName.reduce((acc2,reName)=>{
          const idx = acc
            .findIndex(it => it.region === null ? 
              reName.regionName === 'none' :
              it.region.name === reName.regionName )

          return idx >= 0 ? 
            acc2.map((v,i)=> i === idx ? Object.assign({},v,{searchResult : v.searchResult.concat(curr)}) : v ) :
            acc2.concat({
              region : this.getRegionFromRegionName(reName.regionName, regions),
              searchResult : [ curr ]
            })
        },acc) :
        acc.findIndex(it=>it.region==null) >= 0 ?
          acc.map(it=>it.region === null ? 
            Object.assign({},it,{
              searchResult:it.searchResult.concat(curr)
            }) : 
          it) : 
          acc.concat({
            region : null,
            searchResult : [curr]
          })
        
    },[] as {region:RegionDescriptor|null,searchResult:SearchResultInterface[]}[])
  }

  private getRegionFromRegionName(regionName:string,regions:RegionDescriptor[]):RegionDescriptor|null{
    const idx =  regions.findIndex(re=>re.name == regionName) 
    return idx >= 0 ? regions[idx] : null
  }

}