import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";
import { GroupedParcellation } from "./groupedParcellation";
import { IsGroupedParcellation } from "./isGroupedParcellation.pipe"

const pipe = new IsGroupedParcellation()

@Pipe({
  name: 'parcellationGroupSelected',
  pure: true
})

export class ParcellationGroupSelectedPipe implements PipeTransform {
  public transform(parc: GroupedParcellation|unknown, selectedParcellation: SxplrParcellation): boolean {
    if (!pipe.transform(parc)) return false
    return parc.parcellations.some(p => p.id === selectedParcellation.id)
  }
}
