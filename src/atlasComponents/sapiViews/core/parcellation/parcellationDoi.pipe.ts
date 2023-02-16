import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"

@Pipe({
  name: 'parcellationDoiPipe',
  pure: true
})

export class ParcellationDoiPipe implements PipeTransform {
  public transform(_parc: SxplrParcellation): string[] {
    const parc = translateV3Entities.retrieveParcellation(_parc)
    const urls = (parc?.brainAtlasVersions || []).filter(
      v => v.digitalIdentifier && v.digitalIdentifier['@type'] === 'https://openminds.ebrains.eu/core/DOI'
    ).map(
      v => v.digitalIdentifier['@id'] as string
    )
    return Array.from(new Set(urls))
  }
}
