const VALID_XFORM_SRC = ["LENS_ABA", "CCF_V2_5", "QUICKNII_ABA", "MNI152", "CYRIL_PTCLD", "QUICKNII_WAXHOLM"] as const
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
    CYRIL_PTCLD: {
      NEHUBA: 
      // [
      //   [-0.2, 0.0, 0.0, 96400000.0],
      //   [0.0, -0.2, 0.0, 96400000.0],
      //   [0.0, 0.0, -0.2, 114400000.0],
      //   [0.0, 0.0, 0.0, 1.0]
      // ]
      [
        [-1,0,0,96_500_000],
        [0,-1,0,229_000_000 - 132_500_000],
        [0,0,-1,193_000_000 - 78_500_000],
        [0,0,0,1]
      ]
    },
    MNI152: {
      NEHUBA: [
        [1,0,0,-96_500_000],
        [0,1,0,-132_500_000],
        [0,0,1,-78_500_000],
        [0,0,0,1]
      ]
    },
    CCF_V2_5: {
      NEHUBA: [
        [-1e3, 0, 0, 11400000 - 5737500], //
        [0, 0, -1e3, 13200000 - 6637500], //
        [0, -1e3, 0, 8000000 - 4037500], //
        [0, 0, 0, 1],
      ]
    },
    LENS_ABA: {
      NEHUBA: [
        [-1e6, 0, 0, 11400000 - 5737500], //
        [0, -1e6, 0, 13200000 - 6637500], //
        [0, 0, -1e6, 8000000 - 4037500], //
        [0, 0, 0, 1],
      ]
    },
    // see https://www.nitrc.org/plugins/mwiki/index.php?title=quicknii:Coordinate_systems
    QUICKNII_ABA: {
      NEHUBA: [
        [2.5e4, 0, 0, -5737500], //
        [0, 2.5e4, 0,  -6637500], //
        [0, 0, 2.5e4, -4037500], //
        [0, 0, 0, 1],
      ]
    },
    // see https://www.nitrc.org/plugins/mwiki/index.php?title=quicknii:Coordinate_systems
    QUICKNII_WAXHOLM: {
      NEHUBA: [
        [3.90625e4, 0, 0, -9550781], //
        [0, 3.90625e4, 0,  -24355468], //
        [0, 0, 3.90625e4, -9707031], //
        [0, 0, 0, 1],
      ]
    }
  }

export const defaultXform = [
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
