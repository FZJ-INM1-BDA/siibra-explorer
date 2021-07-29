import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry } from "src/services/stateStore.service";
import { getIdFromFullId } from "common/util"

export const regionsEqual = (r1, r2) => {
  const { fullId: r1FId, relatedAreas: rA1 = [] } = r1
  const { fullId: r2FId, relatedAreas: rA2 = [] } = r2
  const region2Aliases = new Set([getIdFromFullId(r2FId), ...rA2.map(({ fullId }) => getIdFromFullId(fullId))])
  const region1Aliases = new Set([getIdFromFullId(r1FId), ...rA1.map(({ fullId }) => getIdFromFullId(fullId))])
  return region1Aliases.has(getIdFromFullId(r2FId))
    || region2Aliases.has(getIdFromFullId(r1FId))
}

const isSubRegion = (high, low) => regionsEqual(high, low)
  || (
    high.children
    && Array.isArray(high.children)
    && high.children.some(r => isSubRegion(r, low))
  )
    

const filterSubSelect = (dataEntry, selectedRegions) => {
  return dataEntry.parcellationRegion.some(pr => selectedRegions.some(sr => isSubRegion(pr, sr)))
}

@Pipe({
  name: 'filterDataEntriesByRegion',
})

export class FilterDataEntriesByRegion implements PipeTransform {
  public transform(dataentries: IDataEntry[], selectedRegions: any[], flattenedAllRegions: any[]) {
    return dataentries && selectedRegions && selectedRegions.length > 0
      ? dataentries.filter(de => filterSubSelect(de, selectedRegions))
      : dataentries
  }
}
