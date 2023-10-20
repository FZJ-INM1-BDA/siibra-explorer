const VALID_XFORM_SRC = ["CCF_V2_5", "QUICKNII"] as const
const VALID_XFORM_DST = ["NEHUBA"] as const

export type TVALID_LINEAR_XFORM_SRC = typeof VALID_XFORM_SRC[number]
export type TVALID_LINEAR_XFORM_DST = typeof VALID_XFORM_DST[number]

type TLinearXform = number[][]

const _linearXformDict: Record<
  TVALID_LINEAR_XFORM_SRC,
  Record<
  TVALID_LINEAR_XFORM_DST,
    TLinearXform
  >> = {
    CCF_V2_5: {
      NEHUBA: [
        [-1e3, 0, 0, 11400000 - 5737500], //
        [0, 0, -1e3, 13200000 - 6637500], //
        [0, -1e3, 0, 8000000 - 4037500], //
        [0, 0, 0, 1],
      ]
    },
    // see https://www.nitrc.org/plugins/mwiki/index.php?title=quicknii:Coordinate_systems
    QUICKNII: {
      NEHUBA: [
        [2.5e4, 0, 0, -5737500], //
        [0, 2.5e4, 0,  -6637500], //
        [0, 0, 2.5e4, -4037500], //
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
TVALID_LINEAR_XFORM_SRC,
  Record<
    TVALID_LINEAR_XFORM_DST,
    TLinearXform
  >>


export const linearTransform = async (srcTmplName: TVALID_LINEAR_XFORM_SRC, targetTmplName: TVALID_LINEAR_XFORM_DST) => {
  return linearXformDict[srcTmplName][targetTmplName]
}
