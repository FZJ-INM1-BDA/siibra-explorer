import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";


function filterParcs(parcs: SxplrParcellation[]): SxplrParcellation[]{
  const prevIds = new Set(
    parcs.map(p => p.prevId).filter(v => !!v)
  )
  return parcs.filter(p => !prevIds.has(p.id))
}

@Pipe({
  name: 'onlyShowNewest',
  pure: true
})

export class OnlyShowNewestParc implements PipeTransform {
  public transform(parcellations: SxplrParcellation[]): SxplrParcellation[] {
    return filterParcs(parcellations)
  }
}
