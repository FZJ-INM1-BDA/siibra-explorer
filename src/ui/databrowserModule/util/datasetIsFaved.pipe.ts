import { PipeTransform, Pipe } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";

@Pipe({
  name: 'datasetIsFaved'
})
export class DatasetIsFavedPipe implements PipeTransform{
  public transform(favedDataEntry: DataEntry[], dataentry: DataEntry):boolean{
    if (!dataentry) return false
    return favedDataEntry.findIndex(ds => ds.id === dataentry.id) >= 0
  }
}