import { Pipe, PipeTransform } from "@angular/core";
import { TSandsPoint } from "src/util/types";

@Pipe({
  name: 'sandsToNum',
  pure: true
})
export class SandsToNumPipe implements PipeTransform{
  public transform(val: TSandsPoint) {
    return {
      coords: val.coordinates.map(v => v.value / 1e6)
    }
  }
}
