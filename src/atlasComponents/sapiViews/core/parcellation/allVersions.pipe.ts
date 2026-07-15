import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";
import { ParcellationIsVersioned } from "./isVersioned.pipe";

const isVersioned = new ParcellationIsVersioned()

@Pipe({
  name: 'allVersions',
  pure: true
})

export class AllVersionsParcs implements PipeTransform {
  public transform(parcellation: SxplrParcellation, allParcellations: SxplrParcellation[]): SxplrParcellation[] {
    if (!parcellation) {
      return []
    }
    if (!isVersioned.transform(parcellation, allParcellations)) {
      return []
    }
    const nextMap: Record<string, string> = {}
    const prevMap: Record<string, string> = {}
    const idMap : Record<string, SxplrParcellation> = {}
    for (const parc of allParcellations){
      if (!!idMap[parc.id]){
        throw new Error(`${parc.id} already populated`)
      }
      idMap[parc.id] = parc
      
      if (parc.prevId) {
        if (!!nextMap[parc.prevId]) {
          throw new Error(`prevId ${parc.prevId} already defined`)
        }
        if (!!prevMap[parc.id]) {
          throw new Error(`parc.id ${parc.id} already defined`)
        }
        nextMap[parc.prevId] = parc.id
        prevMap[parc.id] = parc.prevId
      }
    }
    
    const prevParcs: SxplrParcellation[] = []
    const nextParcs: SxplrParcellation[] = []

    let backwardId = parcellation.id
    while (!!prevMap[backwardId]){
      const prevParc = idMap[prevMap[backwardId]]
      if (!prevParc) {
        throw new Error(`id ${prevMap[backwardId]} cannot decode into parc`)
      }
      prevParcs.unshift(prevParc)
      backwardId = prevParc.id
    }
    
    let forwardId = parcellation.id
    while (!!nextMap[forwardId]){
      const nextParc = idMap[nextMap[forwardId]]
      if (!nextParc) {
        throw new Error(`id ${nextMap[forwardId]} cannot decode into parc`)
      }
      nextParcs.push(nextParc)
      forwardId = nextParc.id
    }
    return [...prevParcs, parcellation, ...nextParcs]
  }
}
