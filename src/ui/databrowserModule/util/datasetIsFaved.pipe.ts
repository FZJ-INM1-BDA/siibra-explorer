import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry } from "src/services/stateStore.service";

@Pipe({
  name: 'datasetIsFaved',
})
export class DatasetIsFavedPipe implements PipeTransform {
  public transform(favedDataEntry: IDataEntry[], dataentry: IDataEntry): boolean {
    if (!dataentry) { return false }
    return favedDataEntry.findIndex(ds => ds.id === dataentry.id) >= 0
  }
}
