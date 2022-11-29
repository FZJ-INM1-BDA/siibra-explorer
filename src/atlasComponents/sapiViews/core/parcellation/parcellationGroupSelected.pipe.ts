import { Pipe, PipeTransform } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";
import { GroupedParcellation } from "./groupedParcellation";

function isGroupedParc(parc: GroupedParcellation|unknown): parc is GroupedParcellation {
  if (!parc['parcellations']) return false
  return (parc['parcellations'] as SapiParcellationModel[]).every(p => p["@type"] === "minds/core/parcellationatlas/v1.0.0")
}

@Pipe({
  name: 'parcellationGroupSelected',
  pure: true
})

export class ParcellationGroupSelectedPipe implements PipeTransform {
  public transform(parc: GroupedParcellation|unknown, selectedParcellation: SapiParcellationModel): boolean {
    if (!isGroupedParc(parc)) return false
    return parc.parcellations.some(p => p["@id"] === selectedParcellation["@id"])
  }
}
