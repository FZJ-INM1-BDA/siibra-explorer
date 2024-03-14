import { Point, SimpleCompoundFeature } from "src/atlasComponents/sapi/sxplrTypes";

export type CFIndex<T extends string|Point=string|Point> = SimpleCompoundFeature<T>['indices'][number]

export function isPoint(val: string|Point): val is Point{
    return !!(val as any).spaceId && !!(val as any).loc
  }
  