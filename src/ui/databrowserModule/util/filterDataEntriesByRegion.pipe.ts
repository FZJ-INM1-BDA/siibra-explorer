import { Pipe, PipeTransform } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";

const isSubRegion = (high, low) => (high.id && low.id && high.id === low.id) || high.name === low.name
  ? true
  : high.children && high.children.some
    ? high.children.some(r => isSubRegion(r, low))
    : false

const filterSubSelect = (dataEntry, selectedRegions) => 
  dataEntry.parcellationRegion.some(pr => selectedRegions.some(sr => isSubRegion(pr,sr)))

@Pipe({
  name: 'filterDataEntriesByRegion'
})

export class FilterDataEntriesByRegion implements PipeTransform{
  public transform(dataentries: DataEntry[], selectedRegions: any[], flattenedAllRegions: any[]) {
    return dataentries && selectedRegions && selectedRegions.length > 0
      ? dataentries
          .map(de => {
            /**
             * translate parcellationRegion to region representation
             */
            const newParcellationRegion = de.parcellationRegion.map(({name, id, ...rest}) => {

              /**
               * TODO: temporary hack, some dataset region name is not exactly the same as region
               */
              /* https://stackoverflow.com/a/9310752/6059235 */
              const regex = new RegExp(name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i')

              const found = flattenedAllRegions.find(r => {
                /**
                 * TODO replace pseudo id with real uuid
                 */
                return (r.id && id && r.id === id)
                  || regex.test(r.name)
                  || r.synonyms && r.synonyms.length && r.synonyms.some(syn => syn === name) 
                /**
                 * more correct, but probably should use UUID in the future
                 */
                return r.name === name
              })
              return found
                ? { name, id, ...rest, ...found }
                : { name, id, ...rest }
            })
            return {
              ...de,
              parcellationRegion: newParcellationRegion
            }
          })
          .filter(de => filterSubSelect(de, selectedRegions))
      : dataentries
  }
}