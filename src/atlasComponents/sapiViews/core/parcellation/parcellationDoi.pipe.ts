import { Pipe, PipeTransform } from "@angular/core";
import { SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes";

@Pipe({
  name: 'parcellationDoiPipe',
  pure: true
})

export class ParcellationDoiPipe implements PipeTransform {
  public transform(_parc: SxplrParcellation): string[] {
    return (_parc.link || []).map(v => v.href)
  }
}
