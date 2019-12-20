import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry } from "../../services/stateStore.service";

@Pipe({
  name : 'filterRegionDataEntries',
})

export class filterRegionDataEntries implements PipeTransform {
  public transform(arr: Array<{region: any|null, searchResults: IDataEntry[]}>, selectedRegions: any[]): Array<{region: any|null, searchResults: IDataEntry[]}> {
    return selectedRegions.length > 0 ?
      arr.filter(obj => obj.region !== null && selectedRegions.findIndex(r => obj.region.name === r.name) >= 0) :
      arr
  }
}
