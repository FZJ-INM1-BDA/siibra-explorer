import { Pipe, PipeTransform } from "@angular/core";
import { BoundingBox } from "src/atlasComponents/sapi/sxplrTypes";

function tupleToStr(v: [number, number, number]){
  return `[${v.map(v => v.toFixed(3)).join(", ")}]`
}

@Pipe({
  name: 'viewportToText',
  pure: true
})

export class CurrentViewportToTextPipe implements PipeTransform {
  public transform(viewport: BoundingBox) {

    return `
space: ${JSON.stringify(viewport.space?.name)}
unit: mm
position: ${tupleToStr(viewport.center)}
boundingbox:
    min: ${tupleToStr(viewport.minpoint)}
    max: ${tupleToStr(viewport.maxpoint)}
`
  }
}