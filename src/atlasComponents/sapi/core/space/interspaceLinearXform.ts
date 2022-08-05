export const VALID_LINEAR_XFORM_SRC = {
  CCF: "Allen Common Coordination Framework"
}

export const VALID_LINEAR_XFORM_DST = {
  NEHUBA: "nehuba"
}

export type TVALID_LINEAR_XFORM_SRC = keyof typeof VALID_LINEAR_XFORM_SRC
export type TVALID_LINEAR_XFORM_DST = keyof typeof VALID_LINEAR_XFORM_DST

type TLinearXform = number[][]

const _linearXformDict: Record<
  keyof typeof VALID_LINEAR_XFORM_SRC,
  Record<
    keyof typeof VALID_LINEAR_XFORM_DST,
    TLinearXform
  >> = {
  CCF: {
    NEHUBA: [
      [-1e3, 0, 0, 11400000 - 5737500], //
      [0, 0, -1e3, 13200000 - 6637500], //
      [0, -1e3, 0, 8000000 - 4037500], //
      [0, 0, 0, 1],
    ]
  }
}

const defaultXform = [
  [1e3, 0, 0, 0],
  [0, 1e3, 0, 0],
  [0, 0, 1e3, 0],
  [0, 0, 0, 1],
]

const s = `
  LIP
  [ 11400000, 13200000, 8000000 ]
  RSP
  RAS
`

const getProxyXform = <T>(obj: Record<string, T>, cb: (value: T) => T) => new Proxy({}, {
  get: (_target, prop: string, _receiver) => {
    return cb(obj[prop])
  }
})

export const linearXformDict = getProxyXform(_linearXformDict, (value: Record<string, TLinearXform>) => {
  if (!value) return getProxyXform({}, () => defaultXform)
  return getProxyXform(value, (v: TLinearXform) => {
    if (v) return v
    return defaultXform
  })
}) as Record<
  keyof typeof VALID_LINEAR_XFORM_SRC,
  Record<
    keyof typeof VALID_LINEAR_XFORM_DST,
    TLinearXform
  >>


export const linearTransform = async (srcTmplName: keyof typeof VALID_LINEAR_XFORM_SRC, targetTmplName: keyof typeof VALID_LINEAR_XFORM_DST) => {
  return linearXformDict[srcTmplName][targetTmplName]
}
