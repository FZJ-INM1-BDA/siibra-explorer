import { Pipe, PipeTransform } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";

@Pipe({
  name : 'groupDatasetByRegion'
})
export class GroupDatasetByRegion implements PipeTransform{
  public transform(
    datasets:DataEntry[],
    regions:any[]
  ) : {region:any|null,searchResults:DataEntry[]}[]
  {
    
    return datasets.reduce((acc,curr)=>{
      return (curr.regionName && curr.regionName.length > 0) ?
        curr.regionName.reduce((acc2,reName)=>{
          const idx = acc
            .findIndex(it => it.region === null ? 
              reName.regionName === 'none' :
              it.region.name === reName.regionName )

          return idx >= 0 ? 
            acc2.map((v,i)=> i === idx ? Object.assign({},v,{searchResults : v.searchResults.concat(curr)}) : v ) :
            acc2.concat({
              region : this.getRegionFromRegionName(reName.regionName, regions),
              searchResults : [ curr ]
            })
        },acc) :
        acc.findIndex(it=>it.region==null) >= 0 ?
          acc.map(it=>it.region === null ? 
            Object.assign({},it,{
              searchResults:it.searchResults.concat(curr)
            }) : 
          it) : 
          acc.concat({
            region : null,
            searchResults : [curr]
          })
        
    },[] as {region:any|null,searchResults:DataEntry[]}[])
  }

  private getRegionFromRegionName(regionName:string,regions:any[]):any|null{
    const idx =  regions.findIndex(re=>re.name == regionName) 
    return idx >= 0 ? regions[idx] : null
  }

}