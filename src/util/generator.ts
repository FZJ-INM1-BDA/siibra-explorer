export function* timedValues(ms: number = 500, mode: string = 'linear') {
  const startTime = Date.now()

  const getValue = (fraction) => {
    switch (mode) {
      case 'linear':
      default:
        return fraction < 1 ? fraction : 1
    }
  }
  while ((Date.now() - startTime) < ms) {
    yield getValue( (Date.now() - startTime) / ms )
  }
  return 1
}

export function clamp(val: number, min: number, max: number) {
  const _min = min < max ? min : max
  const _max = min < max ? max : min
  return Math.min(
    Math.max(
      val,
      _min,
    ),
    _max,
  )
}
