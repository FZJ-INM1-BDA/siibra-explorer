import { TViewerEvtCtxData } from './../viewer.interface';
import { Pipe, PipeTransform } from "@angular/core";

type Point = [number, number, number]
type BBox = [Point, Point]

const MAGIC_RADIUS = 256

@Pipe({
  name: "nehubaVCtxToBbox",
  pure: true
})

export class NehubaVCtxToBbox implements PipeTransform{
  public transform(event: TViewerEvtCtxData<'nehuba' | 'threeSurfer'>, boxDims: [number, number, number]=null, unit: string = "mm"): BBox{
    if (!event) {
      return null
    }
    if (event.viewerType === 'threeSurfer') {
      return null
    }
    if (!boxDims) {
      boxDims = [MAGIC_RADIUS, MAGIC_RADIUS, MAGIC_RADIUS]
    }
    
    let divisor = 1
    if (unit !== "mm") {
      console.warn(`unit other than mm is not yet supported`)
      return null
    }
    divisor = 1e6
    const { payload } = event as TViewerEvtCtxData<'nehuba'>
    
    if (!payload.nav) return null

    const { position, zoom } = payload.nav
    // position is in nm
    // zoom can be directly applied as a multiple
    const min = position.map((v, idx) => (v - (boxDims[idx] * zoom)) / divisor) as Point
    const max = position.map((v, idx) => (v + (boxDims[idx] * zoom)) / divisor) as Point
    return [min, max]
  }
}
