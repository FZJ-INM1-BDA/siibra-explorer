import { Pipe, PipeTransform } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";

@Pipe({
  name: 'filterDataEntriesByRegion'
})

export class FilterDataEntriesByRegion implements PipeTransform{
  public transform(dataentries: DataEntry[], selectedRegions: any[]) {
    return dataentries && selectedRegions && selectedRegions.length > 0
      ? dataentries.filter(de => 
          de.parcellationRegion.some(pr => {

            /**
             * TODO: temporary hack, some dataset region name is not exactly the same as region
             */
            /* https://stackoverflow.com/a/9310752/6059235 */
            const regex = new RegExp(pr.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i')
            return selectedRegions.some(sr => regex.test(sr.name))
            /**
             * more correct, but probably should use UUID in the future
             */
            return selectedRegions.some(sr => sr.name === pr.name)
          })
        )
      : dataentries
  }
}