import { TContextArg } from './../viewer.interface';
import { Pipe, PipeTransform } from "@angular/core";

type Point = [number, number, number]
type BBox = [Point, Point]

const MAGIC_RADIUS = 256

@Pipe({
  name: "nehubaVCtxToBbox",
  pure: true
})

export class NehubaVCtxToBbox implements PipeTransform{
  public transform(event: TContextArg<'nehuba' | 'threeSurfer'>, unit: string = "mm"): BBox{
    if (!event) {
      return null
    }
    if (event.viewerType === 'threeSurfer') {
      return null
    }
    let divisor = 1
    if (unit === "mm") {
      divisor = 1e6
    }
    const { payload } = event as TContextArg<'nehuba'>
    
    if (!payload.nav) return null

    const { position, zoom } = payload.nav
    // position is in nm
    // zoom can be directly applied as a multiple
    const min = position.map(v => (v - (MAGIC_RADIUS * zoom)) / divisor) as Point
    const max = position.map(v => (v + (MAGIC_RADIUS * zoom)) / divisor) as Point
    return [min, max]
  }
}
