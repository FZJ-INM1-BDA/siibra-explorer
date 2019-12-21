import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry } from "../../services/stateStore.service";

@Pipe({
  name : 'sortDataEntriesToRegion',
})

export class SortDataEntriesToRegion implements PipeTransform {
  public transform(regions: any[], datasets: IDataEntry[]): Array<{region: any, searchResults: IDataEntry[]}> {
    return regions.map(region => ({
      region,
      searchResults : datasets.filter(dataset => dataset.parcellationRegion.some(r => r.name === region.name)),
    }))
  }
}
