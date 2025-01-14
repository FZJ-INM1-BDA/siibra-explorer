import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";

@Pipe({
  name: 'isVersioned',
  pure: true
})

export class ParcellationIsVersioned implements PipeTransform {
  public transform(parcellation: SxplrParcellation, allParcellations: SxplrParcellation[]): boolean {
    const prevIds = new Set(
      allParcellations.map(p => !!p.prevId ? [p.prevId, p.id] :  []).flatMap(v => v)
    )
    return prevIds.has(parcellation.id)
  }
}
