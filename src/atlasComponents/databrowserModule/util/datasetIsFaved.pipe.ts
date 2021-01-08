import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry } from "src/services/stateStore.service";
import { IHasFullId } from "src/util/interfaces";
import { getKgSchemaIdFromFullId } from "./getKgSchemaIdFromFullId.pipe";

@Pipe({
  name: 'datasetIsFaved',
})
export class DatasetIsFavedPipe implements PipeTransform {
  public transform(favedDataEntry: (Partial<IDataEntry>|IHasFullId)[], dataentry: IHasFullId): boolean {
    if (!dataentry) { return false }
    const re2 = getKgSchemaIdFromFullId(dataentry.fullId)
    if (!re2) return false
    return favedDataEntry?.findIndex(ds => {
      const re1 = getKgSchemaIdFromFullId(ds.fullId)
      if (!re1) return false
      return re1[1] === re2[1]
    }) >= 0
  }
}
