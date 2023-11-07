import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";

@Pipe({
  name: 'parcTmplDoiPipe',
  pure: true
})

export class ParcTmplDoiPipe implements PipeTransform {
  public transform(_parc: SxplrParcellation|SxplrTemplate): string[] {
    return (_parc.link || []).map(v => v.href)
  }
}
