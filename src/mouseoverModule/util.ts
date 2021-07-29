
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
export const temporalPositveScanFn = (acc: Array<{segments: any, landmark: any, userLandmark: any}>, curr: {segments: any, landmark: any, userLandmark: any}) => {

  const keys = Object.keys(curr)

  // empty array is truthy
  const isPositive = keys.some(key => Array.isArray(curr[key])
    ? curr[key].length > 0
    : !!curr[key]
  )

  return isPositive
    ? [curr, ...(acc.filter(item => !keys.some(key => !!item[key])))] as Array<{segments?: any, landmark?: any, userLandmark?: any}>
    : acc.filter(item => !keys.some(key => !!item[key]))
}