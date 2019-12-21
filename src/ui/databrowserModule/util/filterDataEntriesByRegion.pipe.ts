import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry } from "src/services/stateStore.service";

const isSubRegion = (high, low) => (high.id && low.id && high.id === low.id) || high.name === low.name
  ? true
  : high.children && high.children.some
    ? high.children.some(r => isSubRegion(r, low))
    : false

const filterSubSelect = (dataEntry, selectedRegions) =>
  dataEntry.parcellationRegion.some(pr => selectedRegions.some(sr => isSubRegion(pr, sr)))

@Pipe({
  name: 'filterDataEntriesByRegion',
})

export class FilterDataEntriesByRegion implements PipeTransform {
  public transform(dataentries: IDataEntry[], selectedRegions: any[], flattenedAllRegions: any[]) {
    return dataentries && selectedRegions && selectedRegions.length > 0
      ? dataentries
        .map(de => {
          /**
             * translate parcellationRegion to region representation
             */
          const newParcellationRegion = de.parcellationRegion.map(({name, id, ...rest}) => {

            const found = flattenedAllRegions.find(r => {
              /**
                 * TODO replace pseudo id with real uuid
                 */
              return (r.id && id && r.id === id)
                  || r.name === name
                  || r.relatedAreas && r.relatedAreas.length && r.relatedAreas.some(syn => syn === name)
            })
            return found
              ? { name, id, ...rest, ...found }
              : { name, id, ...rest }
          })
          return {
            ...de,
            parcellationRegion: newParcellationRegion,
          }
        })
        .filter(de => filterSubSelect(de, selectedRegions))
      : dataentries
  }
}
