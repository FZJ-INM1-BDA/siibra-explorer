import { Observable, Subject } from "rxjs"
import { getUuid } from "src/util/fn"
import { IMessagingActions, IMessagingActionTmpl, TVec4 } from "../types"
import { INmvTransform } from "./type"

export const TYPE = 'bas.datasource'

const waitFor = (condition: (...arg: any[]) => boolean) => new Promise((rs, rj) => {
  const intervalRef = setInterval(() => {
    if (condition()) {
      clearInterval(intervalRef)
      rs()
    }
  }, 1000)
})

const NM_IDS = {
  AMBA_V3: 'hbp:Allen_Mouse_CCF_v3(nm)',
  WAXHOLM_V1_01: 'hbp:WHS_SD_Rat_v1.01(nm)',
  BIG_BRAIN: 'hbp:BigBrain_r2015(nm)',
  COLIN: 'hbp:Colin27_r2008(nm)',
  MNI152_2009C_ASYM: 'hbp:ICBM_Asym_r2009c(nm)',
}

const IAV_IDS = {
  AMBA_V3: 'minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9',
  WAXHOLM_V1_01: 'minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8',
  BIG_BRAIN: 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588',
  COLIN: 'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992',
  MNI152_2009C_ASYM: 'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2',
}

const translateSpace = (spaceId: string) => {
  for (const key in NM_IDS){
    if (NM_IDS[key] === spaceId) return IAV_IDS[key]
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

    await waitFor(() => !!(window as any).export_nehuba)

    const b64Encoded = encoding.indexOf('base64') >= 0
    const isGzipped = encoding.indexOf('gzip') >= 0
    let data = rawData
    if (b64Encoded) {
      data = atob(data)
    }
    if (isGzipped) {
      data = (window as any).export_nehuba.pako.inflate(data)
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
    const payload: IMessagingActionTmpl['loadResource'] = {
      '@id': uuid,
      "@type" : 'swc',
      unload: () => {
        URL.revokeObjectURL(tmpUrl)
      },
      url: tmpUrl,
      resourceParam: {
        transform: [
          [...A[0], b[0]] as TVec4,
          [...A[1], b[1]] as TVec4,
          [...A[2], b[2]] as TVec4,
          [0, 0, 0, 1],
        ]
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
