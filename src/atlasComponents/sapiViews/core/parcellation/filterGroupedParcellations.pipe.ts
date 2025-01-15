import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";
import { GroupedParcellation } from "./groupedParcellation";
import { parcellationGroupOrder } from "src/util/constants";

type RType<T> = T extends true
? GroupedParcellation
: SxplrParcellation

const order = (parcellationGroupOrder as string[])

function sortParcellations(parcellations: SxplrParcellation[]): SxplrParcellation[]{

  // sort so that
  // 1. versioned filter to top
  // 2. newest filter to top
  const nextIdDict: Record<string, string> = {}
  const idToParc: Record<string, SxplrParcellation> = {}
  
  for (const parc of parcellations){
    idToParc[parc.id] = parc
    if (parc.prevId) {
      if (parc.prevId in nextIdDict) {
        throw new Error(`${parc.prevId} already exists in dict, taken by ${nextIdDict[parc.prevId]}`)
      }
      nextIdDict[parc.prevId] = parc.id
    }
  }
  const newestIds = Object.values(nextIdDict).filter(id => !(id in nextIdDict))
  const versionedParcs = newestIds.map(idToFind => {
    const versionedParcs: SxplrParcellation[] = []

    while (!!idToFind){
      const foundParc = idToParc[idToFind]
      
      if (!foundParc) {
        throw new Error(`${idToFind} not found in idToParc dictionary`)
      }
      versionedParcs.push(foundParc)
      idToFind = foundParc.prevId
    }
    return versionedParcs
  }).flatMap(arr => arr)

  const versionedParcIds = new Set(versionedParcs.map(p => p.id))
  const unversionedParcs = parcellations.filter(p => !versionedParcIds.has(p.id))
  return [
    ...versionedParcs,
    ...unversionedParcs,
  ]
}

@Pipe({
  name: `filterGroupedParcs`,
  pure: true
})

export class FilterGroupedParcellationPipe implements PipeTransform{

  public transform<T extends boolean>(parcs: SxplrParcellation[], getGroupsFlag: T): (RType<T>)[]
  public transform(parcs: SxplrParcellation[], getGroupsFlag: boolean): (SxplrParcellation[])|(GroupedParcellation[]) {
    if (!getGroupsFlag) {
      return sortParcellations(parcs.filter(p => !p.modality))
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
        new GroupedParcellation(key, sortParcellations(map[key]))
      )
    }
    return returnGrps
      .sort((a, b) => {
        // if order new groups are introduced, and not yet added to parcellationgrouporder
        // this code will ensure that they stay at the bottom (until we have ~300 parcellation groups, haha)
        let aorder = order.indexOf(a.name)
        if (aorder < 0) {
          aorder = 255 + a.name.charCodeAt(0)
        }
        let border = order.indexOf(b.name)
        if (border < 0) {
          border = 255 + b.name.charCodeAt(0)
        }
        return aorder - border
      })
  }
}
