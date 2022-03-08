import { Pipe, PipeTransform } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi";
import { GroupedParcellation } from "./groupedParcellation";

@Pipe({
  name: `filterGroupedParcs`,
  pure: true
})

export class FilterGroupedParcellationPipe implements PipeTransform{
  public transform(parcs: SapiParcellationModel[], getGroupsFlag: boolean=false): (SapiParcellationModel|GroupedParcellation)[] {
    if (!getGroupsFlag) {
      return parcs.filter(p => !p.modality)
    }
    const map: Record<string, SapiParcellationModel[]> = {}
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
