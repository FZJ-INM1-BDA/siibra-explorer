import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";

@Pipe({
  name: 'isNewest',
  pure: true
})

export class ParcellationIsNewest implements PipeTransform {
  public transform(parcellation: SxplrParcellation, allParcellations: SxplrParcellation[]): boolean {
    const prevIds = new Set(
      allParcellations.map(p => p.prevId).filter(v => !!v)
    )
    return !prevIds.has(parcellation.id)
  }
}
