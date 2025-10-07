import { Pipe, PipeTransform } from "@angular/core";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";

type PipeInput = {
  atlas: SxplrAtlas
  parcellation: SxplrParcellation
  template: SxplrTemplate
}

@Pipe({
  name: 'atprToMd',
  pure: true,
})

export class ATPRToMarkdown implements PipeTransform {
  public transform(value: PipeInput) {
    const { atlas, template, parcellation } = value
    return `${atlas.name} / ${template.shortName || template.name} / ${parcellation.shortName || parcellation.name}`
  }
}
