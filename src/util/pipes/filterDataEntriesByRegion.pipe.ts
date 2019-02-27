import { Pipe, PipeTransform } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";

@Pipe({
  name: 'filterDataEntriesByRegion'
})

export class FilterDataEntriesByRegion implements PipeTransform{
  public transform(dataentries: DataEntry[], selectedRegions: any[]) {
    return selectedRegions.length > 0
      ? dataentries.filter(de => 
          de.parcellationRegion.some(pr => {

            /**
             * TODO: temporary hack, some dataset region name is not exactly the same as region
             */
            const regex = new RegExp(pr.name)
            return selectedRegions.some(sr => regex.test(sr.name))
            /**
             * more correct
             */
            return selectedRegions.some(sr => sr.name === pr.name)
          })
        )
      : dataentries
  }
}