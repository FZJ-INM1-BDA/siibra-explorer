import { Pipe, PipeTransform } from "@angular/core";
import { Point, SimpleCompoundFeature } from "src/atlasComponents/sapi/sxplrTypes";

export function isPoint(val: string|Point): val is Point{
  return !!(val as any).spaceId && !!(val as any).loc
}


export type CFIndex<T extends string|Point=string|Point> = SimpleCompoundFeature<T>['indices'][number]


function cfIndexHasPoint(val: CFIndex): val is CFIndex<Point>{
  return isPoint(val.index)
}

@Pipe({
  name: 'filterForPoints',
  pure: true
})
export class FilterPointTransformer implements PipeTransform{
  public transform(value: CFIndex[]): CFIndex<Point>[] {
    return value.filter(cfIndexHasPoint)
  }
}
