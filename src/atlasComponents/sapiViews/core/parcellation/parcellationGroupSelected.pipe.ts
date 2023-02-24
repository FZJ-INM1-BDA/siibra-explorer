import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";
import { GroupedParcellation } from "./groupedParcellation";

function isGroupedParc(parc: GroupedParcellation|unknown): parc is GroupedParcellation {
  return !!parc['parcellations']
}

@Pipe({
  name: 'parcellationGroupSelected',
  pure: true
})

export class ParcellationGroupSelectedPipe implements PipeTransform {
  public transform(parc: GroupedParcellation|unknown, selectedParcellation: SxplrParcellation): boolean {
    if (!isGroupedParc(parc)) return false
    return parc.parcellations.some(p => p.id === selectedParcellation.id)
  }
}
