import { Observable, Subject } from "rxjs"
import { getExportNehuba, getUuid } from "src/util/fn"
import { IMessagingActions, IMessagingActionTmpl, TVec4, TMat4 } from "../types"
import { INmvTransform } from "./type"

export const TYPE = 'bas:datasource'

const waitFor = (condition: (...arg: any[]) => boolean) => new Promise<void>((rs, rj) => {
  const intervalRef = setInterval(() => {
    if (condition()) {
      clearInterval(intervalRef)
      rs()
    }
  }, 1000)
})

const NM_IDS = {
  AMBA_V3: 'hbp:Allen_Mouse_CCF_v3(um)',
  WAXHOLM_V1_01: 'hbp:WHS_SD_Rat_v1.01(um)',
  BIG_BRAIN: 'hbp:BigBrain_r2015(um)',
  COLIN: 'hbp:Colin27_r2008(um)',
  MNI152_2009C_ASYM: 'hbp:ICBM_Asym_r2009c(um)',
}

export const IAV_IDS = {
  AMBA_V3: 'minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9',
  WAXHOLM_V1_01: 'minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8',
  BIG_BRAIN: 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588',
  COLIN: 'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992',
  MNI152_2009C_ASYM: 'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2',
}

/**
 * TODO, should unify navigation voxelSize
 * the emitted voxelCoord should be calculated on the fly
 */
export const IAV_VOXEL_SIZES_NM = {
  AMBA_V3: [
    25000,
    25000,
    25000
  ],
  WAXHOLM_V1_01: [
    39062.5,
    39062.5,
    39062.5
  ],
  BIG_BRAIN: [
    21166.666015625,
    20000,
    21166.666015625
  ],
  COLIN: [
    1000000,
    1000000,
    1000000,
  ],
  MNI152_2009C_ASYM: [
    1000000,
    1000000,
    1000000
  ]
}

const translateSpace = (spaceId: string) => {
  for (const key in NM_IDS){
    if (NM_IDS[key] === spaceId) return IAV_IDS[key]
  }
  return null
}

const getVoxelFromSpace = (spaceId: string) => {
  for (const key in NM_IDS){
    if (NM_IDS[key] === spaceId) return IAV_VOXEL_SIZES_NM[key]
  }
  return null
}

export const processJsonLd = (json: { [key: string]: any }): Observable<IMessagingActions<keyof IMessagingActionTmpl>> => {
  const subject = new Subject<IMessagingActions<keyof IMessagingActionTmpl>>()
  const main = (async () => {

    const {
      encoding,
      mediaType,
      data: rawData,
      transformations
    } = json

    if (mediaType.indexOf('model/swc') < 0) return subject.error(`mediaType of ${mediaType} cannot be parsed. Not 'model/swc'`)

    if (!Array.isArray(transformations)) {
      return subject.error(`transformations must be an array!`)
    }

    if (!transformations[0]) {
      return subject.error(`transformations[0] must be defined`)
    }
    const { toSpace, params } = transformations[0] as INmvTransform
    const { A, b } = params

    const iavSpace = translateSpace(toSpace)
    if (!iavSpace) {
      return subject.error(`toSpace with id ${toSpace} cannot be found.`)
    }
    subject.next({
      type: 'loadTemplate',
      payload: {
        ['@id']: iavSpace
      }
    })

    await waitFor(() => !!getExportNehuba())

    const b64Encoded = encoding.indexOf('base64') >= 0
    const isGzipped = encoding.indexOf('gzip') >= 0
    let data = rawData
    if (b64Encoded) {
      data = atob(data)
    }
    if (isGzipped) {
      data = getExportNehuba().pako.inflate(data)
    }
    let output = ``
    for (let i = 0; i < data.length; i++) {
      output += String.fromCharCode(data[i])
    }

    const encoder = new TextEncoder()
    const tmpUrl = URL.createObjectURL(
      new Blob([ encoder.encode(output) ], { type: 'application/octet-stream' })
    )
    const uuid = getUuid()

    // NG internal treats skeleton as mm
    const voxelSize = getVoxelFromSpace(toSpace)
    /**
     * swc seem to scale with voxelSize... strangely enough
     * voxelSize nm / voxel -> goal is 1 voxel/um
     * 1e3 / voxelSize
     */
    const scaleUmToVoxelFixed = [
      1e3 / voxelSize[0],
      1e3 / voxelSize[1],
      1e3 / voxelSize[2],
    ]
    // NG translation works on nm scale
    const scaleUmToNm = 1e3
    const { mat3, vec3 } = getExportNehuba()
    const modA = mat3.fromValues(
      scaleUmToVoxelFixed[0], 0, 0,
      0, scaleUmToVoxelFixed[1], 0,
      0, 0, scaleUmToVoxelFixed[2]
    )
    mat3.mul(modA, modA, [...A[0], ...A[1], ...A[2]])
    const modb = vec3.scale(vec3.create(), b, scaleUmToNm)
    const transform = [
      [...modA.slice(0, 3), modb[0]] as TVec4,
      [...modA.slice(3, 6), modb[1]] as TVec4,
      [...modA.slice(6), modb[2]] as TVec4,
      [0, 0, 0, 1],
    ] as TMat4
    const payload: IMessagingActionTmpl['loadResource'] = {
      '@id': uuid,
      "@type" : 'swc',
      unload: () => {
        URL.revokeObjectURL(tmpUrl)
      },
      url: tmpUrl,
      resourceParam: {
        transform
      }
    }
    subject.next({
      type: 'loadResource',
      payload
    })
    
    subject.complete()
  })
  setTimeout(main);
  return subject
}
