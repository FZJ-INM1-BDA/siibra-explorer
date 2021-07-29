import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry } from "src/services/stateStore.service";
import { CountedDataModality, temporaryFilterDataentryName } from '../databrowser.service'

export const NO_METHODS = `NO_METHODS`

@Pipe({
  name : 'filterDataEntriesByMethods',
})

export class FilterDataEntriesbyMethods implements PipeTransform {
  public transform(dataEntries: IDataEntry[], dataModalities: CountedDataModality[]): IDataEntry[] {
    const noMethodDisplayName = temporaryFilterDataentryName(NO_METHODS)
    const includeEmpty = dataModalities.some(d => d.name === noMethodDisplayName)
    return dataEntries && dataModalities && dataModalities.length > 0
      ? dataEntries.filter(dataEntry => {
        return includeEmpty && dataEntry.methods.length === 0
            || dataEntry.methods.some(m =>
              dataModalities.findIndex(dm => dm.name === temporaryFilterDataentryName(m)) >= 0)
      })
      : dataEntries
  }
}
