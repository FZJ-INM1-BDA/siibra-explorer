import { Pipe, PipeTransform } from "@angular/core";
import { Qualification } from "src/atlasComponents/sapi/typeV3"
import { SxplrRegion, SxplrParcellation } from "src/atlasComponents/sapi/sxplrTypes"

type InputType = {
  qualification: Qualification
  region: SxplrRegion,
  parcellation: SxplrParcellation
}

@Pipe({
  name: "dedupRelatedRegionPipe",
  pure: true
})
export class DedupRelatedRegionPipe implements PipeTransform{
  public transform(arr: InputType[]): InputType[] {
    if (!arr) {
      return []
    }
    const accumulator: InputType[] = []
    for (const item of arr) {
      const exists = accumulator.find(v => (
        v.qualification === item.qualification
        && item.region.name === v.region.name
        && item.parcellation.id === v.parcellation.id)
      )
      if (exists) {
        continue
      }
      accumulator.push(item)
    }
    return accumulator
  }
}
