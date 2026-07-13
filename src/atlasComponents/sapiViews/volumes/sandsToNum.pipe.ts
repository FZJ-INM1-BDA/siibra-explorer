import { Pipe, PipeTransform } from "@angular/core";
import { TSandsPoint } from "src/util/types";

const MM_UNITS = [
  "https://openminds.om-i.org/instances/unitOfMeasurement/millimeter",
  "id.link/mm",
]

@Pipe({
  name: 'sandsToNum',
  pure: true
})
export class SandsToNumPipe implements PipeTransform{
  public transform(val: TSandsPoint) {
    return {
      coords: val.coordinates.map(v => {
        if (v.unit?.["@id"] && MM_UNITS.includes(v.unit["@id"])) {
          return v.value
        }
        return v.value / 1e6
      })
    }
  }
}
