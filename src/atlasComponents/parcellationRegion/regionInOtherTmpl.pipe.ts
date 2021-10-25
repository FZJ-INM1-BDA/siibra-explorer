import { Pipe, PipeTransform } from "@angular/core";
import { TSiibraExRegion } from "./type";

@Pipe({
  name: 'regionInOtherTmpl',
  pure: true
})

export class RegionInOtherTmplPipe implements PipeTransform{
  public transform(region: TSiibraExRegion){
    const { templateSpaces: allTmpl = [] } = region?.context?.atlas || {}
    return allTmpl.filter(t => (region?.availableIn || []).find(availTmpl => availTmpl['id'] === t["@id"]))
  }
}
