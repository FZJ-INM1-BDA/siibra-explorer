import { Pipe, PipeTransform } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";


@Pipe({
  name : 'filterRegionDataEntries'
})

export class filterRegionDataEntries implements PipeTransform{
  public transform(arr:{region:any|null,searchResults:DataEntry[]}[],selectedRegions:any[]):{region:any|null,searchResults:DataEntry[]}[]{
    return selectedRegions.length > 0 ? 
      arr.filter(obj=> obj.region !== null && selectedRegions.findIndex(r=>obj.region.name === r.name) >= 0) :
      arr
  }
}