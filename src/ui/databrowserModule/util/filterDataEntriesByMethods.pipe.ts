import { PipeTransform, Pipe } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";
import { temporaryFilterDataentryName, CountedDataModality } from '../databrowser.service'

export const NO_METHODS = `NO_METHODS`

@Pipe({
  name : 'filterDataEntriesByMethods'
})

export class FilterDataEntriesbyMethods implements PipeTransform{
  public transform(dataEntries:DataEntry[],dataModalities:CountedDataModality[]):DataEntry[]{
    const noMethodDisplayName = temporaryFilterDataentryName(NO_METHODS)
    const includeEmpty = dataModalities.some(d => d.name === noMethodDisplayName)
    return dataEntries && dataModalities && dataModalities.length > 0
      ? dataEntries.filter(dataEntry => {
          return dataEntry.activity.some(a => 
            includeEmpty
              ? a.methods.length === 0
              : a.methods.some(m => 
                  dataModalities.findIndex(dm => dm.name === temporaryFilterDataentryName(m)) >= 0))
        })
      : dataEntries
  }
}
