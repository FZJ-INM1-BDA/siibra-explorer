import { PipeTransform, Pipe } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";


@Pipe({
  name : 'filterDataEntriesByType'
})

export class FilterDataEntriesbyType implements PipeTransform{
  public transform(dataEntries:DataEntry[],showDataType:Set<string>):DataEntry[]{
    return dataEntries.filter(dataEntry=>dataEntry.formats.some(format => showDataType.has(format)))
  }
}