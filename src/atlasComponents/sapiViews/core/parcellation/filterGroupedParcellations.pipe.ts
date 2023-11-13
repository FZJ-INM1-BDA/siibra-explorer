import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";
import { GroupedParcellation } from "./groupedParcellation";

type RType<T> = T extends true
? GroupedParcellation
: SxplrParcellation

@Pipe({
  name: `filterGroupedParcs`,
  pure: true
})

export class FilterGroupedParcellationPipe implements PipeTransform{

  public transform<T extends boolean>(parcs: SxplrParcellation[], getGroupsFlag: T): (RType<T>)[]
  public transform(parcs: SxplrParcellation[], getGroupsFlag: boolean): (SxplrParcellation[])|(GroupedParcellation[]) {
    if (!getGroupsFlag) {
      return parcs.filter(p => !p.modality)
    }
    const map: Record<string, SxplrParcellation[]> = {}
    for (const parc of parcs.filter(p => !!p.modality)) {
      if (!map[parc.modality]) {
        map[parc.modality] = []
      }
      map[parc.modality].push(parc)
    }

    const returnGrps: GroupedParcellation[] = []
    for (const key in map) {
      returnGrps.push(
        new GroupedParcellation(key, map[key])
      )
    }
    return returnGrps
  }
}
