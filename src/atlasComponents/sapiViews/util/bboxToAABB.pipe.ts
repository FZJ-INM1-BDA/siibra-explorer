import { Pipe, PipeTransform } from "@angular/core";
import { TNgAnnotationAABBox } from "src/atlasComponents/annotations";
import { BBox } from "src/features/util";

@Pipe({
  name: 'bboxToAABB',
  pure: true
})

export class BBoxToAABBPipe implements PipeTransform{
  public transform(value: BBox): TNgAnnotationAABBox {
    return {
      id: JSON.stringify(value),
      pointA: value[0].map(v => v*1e6) as [number, number, number],
      pointB: value[1].map(v => v*1e6) as [number, number, number],
      type: 'aabbox'
    }
  }
}
