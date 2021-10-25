import { IAnnotationGeometry } from "src/atlasComponents/userAnnotations/tools/type"
import { TMouseOverSegment } from "./type"

export type TOnHoverObj = {
  segments: TMouseOverSegment[]
  annotation: IAnnotationGeometry
  landmark: {
    landmarkName: number
  }
  userLandmark: any
}

/**
 * Scan function which prepends newest positive (i.e. defined) value
 *
 * e.g. const source = new Subject()
 * source.pipe(
 *  scan(temporalPositveScanFn, [])
 * ).subscribe(this.log.log) // outputs
 *
 *
 *
 */
export const temporalPositveScanFn = (acc: Array<TOnHoverObj>, curr: Partial<TOnHoverObj>) => {

  const keys = Object.keys(curr)

  // empty array is truthy
  const isPositive = keys.some(key => Array.isArray(curr[key])
    ? curr[key].length > 0
    : !!curr[key]
  )

  return isPositive
    ? [curr, ...(acc.filter(item => !keys.some(key => !!item[key])))] as Array<TOnHoverObj>
    : acc.filter(item => !keys.some(key => !!item[key]))
}
