import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/type_sxplr";
import { translateV3Entities } from "src/atlasComponents/sapi/translate_v3"

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
