import { PipeTransform, Pipe } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";

@Pipe({
  name : 'sortDataEntriesToRegion'
})

export class SortDataEntriesToRegion implements PipeTransform{
  public transform(regions: any[], datasets:DataEntry[]):{region:any,searchResults:DataEntry[]}[]{
    return regions.map(region => ({
      region,
      searchResults : datasets.filter(dataset => dataset.regionName.some(r => r.regionName === region.name))
    }))
  }
}