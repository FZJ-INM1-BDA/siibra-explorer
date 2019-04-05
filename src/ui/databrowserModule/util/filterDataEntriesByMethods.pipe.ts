import { PipeTransform, Pipe } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";
import { temporaryFilterDataentryName, CountedDataModality } from '../databrowser.service'

@Pipe({
  name : 'filterDataEntriesByMethods'
})

export class FilterDataEntriesbyMethods implements PipeTransform{
  public transform(dataEntries:DataEntry[],dataModalities:CountedDataModality[]):DataEntry[]{
    return dataEntries && dataModalities && dataModalities.length > 0
      ? dataEntries.filter(dataEntry => {
          return dataEntry.activity.some(a => a.methods.some(m => dataModalities.findIndex(dm => dm.name === temporaryFilterDataentryName(m)) >= 0))
        })
      : dataEntries
  }
}