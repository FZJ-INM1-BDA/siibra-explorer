import { Pipe, PipeTransform } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";

@Pipe({
  name: 'parcellationDoiPipe',
  pure: true
})

export class ParcellationDoiPipe implements PipeTransform {
  public transform(parc: SapiParcellationModel): string[] {
    const urls = (parc?.brainAtlasVersions || []).filter(
      v => v.digitalIdentifier && v.digitalIdentifier['@type'] === 'https://openminds.ebrains.eu/core/DOI'
    ).map(
      v => v.digitalIdentifier['@id'] as string
    )
    return Array.from(new Set(urls))
  }
}
