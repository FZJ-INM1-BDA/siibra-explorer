import { PipeTransform, Pipe } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";


@Pipe({
  name : 'filterDataEntriesByType'
})

export class FilterDataEntriesbyType implements PipeTransform{
  public transform(dataEntries:DataEntry[],hideTypeSet:Set<string>):DataEntry[]{
    return dataEntries.filter(dataEntry=>!hideTypeSet.has(dataEntry.type))
  }
}