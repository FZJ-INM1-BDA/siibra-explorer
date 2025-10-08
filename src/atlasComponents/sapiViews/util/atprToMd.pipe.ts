import { Pipe, PipeTransform } from "@angular/core";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";

type PipeInput = {
  atlas: SxplrAtlas
  parcellation: SxplrParcellation
  template: SxplrTemplate
  regions: SxplrRegion[]
}

@Pipe({
  name: 'atprToMd',
  pure: true,
})

export class ATPRToMarkdown implements PipeTransform {
  public transform(value: PipeInput) {
    const { atlas, template, parcellation, regions } = value
    if (!atlas || !template || !parcellation) {
      return ``
    }
    const msg = `${atlas.name} / ${template.shortName || template.name}`
    const parcName = parcellation.shortName || parcellation.name
    if (regions.length === 0) {
      return `${msg} / ${parcName}`
    }
    if (regions.length === 1) {
      return `${msg} / ${regions[0].name} _(${parcName})_`
    }
    return `${msg} / ${regions.length} areas _(${parcName})_`
  }
}
