import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry } from "../../services/stateStore.service";

@Pipe({
  name : 'groupDatasetByRegion',
})
export class GroupDatasetByRegion implements PipeTransform {
  public transform(datasets: IDataEntry[], regions: any[]): Array<{region: any|null, searchResults: IDataEntry[]}> {

    return datasets.reduce((acc, curr) => {
      return (curr.parcellationRegion && curr.parcellationRegion.length > 0)
        ? curr.parcellationRegion.reduce((acc2, reName) => {
          const idx = acc.findIndex(it => it.region === null
            ? reName.name === 'none'
            : it.region.name === reName.name )

          return idx >= 0
            ? acc2.map((v, i) => i === idx
              ? Object.assign({}, v, {searchResults : v.searchResults.concat(curr)})
              : v )
            : acc2.concat({
                region : this.getRegionFromRegionName(reName.name, regions),
                searchResults : [ curr ],
              })
          }, acc)
        : acc.findIndex(it => it.region == null) >= 0
          ? acc.map(it => it.region === null
            ? Object.assign({}, it, {searchResults: it.searchResults.concat(curr)})
            : it)
          : acc.concat({
              region : null,
              searchResults : [curr],
            })
    }, [] as Array<{region: any|null, searchResults: IDataEntry[]}>)
  }

  private getRegionFromRegionName(regionName: string, regions: any[]): any|null {
    const idx =  regions.findIndex(re => re.name == regionName)
    return idx >= 0 ? regions[idx] : null
  }
}
