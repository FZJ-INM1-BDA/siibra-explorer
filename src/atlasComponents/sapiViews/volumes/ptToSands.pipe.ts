import { Pipe, PipeTransform } from "@angular/core";
import { getUuid } from "src/util/fn";
import { TSandsPoint } from "src/util/types";

@Pipe({
  name: 'ptToSands',
  pure: true
})

export class PtToSandesPipe implements PipeTransform{
  public transform(triplet: number[], space_id: string): TSandsPoint {
    return {
      "@id": getUuid(),
      "@type": "https://openminds.om-i.org/types/CoordinatePoint",
      "coordinateSpace": {
        "@id": space_id,
      },
      "coordinates": triplet.map(v => {
        return {
          "@type": "https://openminds.om-i.org/types/QuantitativeValue",
          "value": v,
          "@id": "",
          "unit": {
            "@id": "https://openminds.om-i.org/instances/unitOfMeasurement/millimeter"
          }
        }
      })
    }
  }
}