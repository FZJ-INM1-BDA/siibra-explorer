import { interval, Observable, of } from 'rxjs'
import { filter, mapTo, take } from 'rxjs/operators'
import { CMByName, EnumColorMapName, mapKeyColorMap } from './colorMaps'
import { MetaV1Schema } from 'src/atlasComponents/sapi/typeV3'
import { TFace, TSandsPoint } from './types'


// eslint-disable-next-line  @typescript-eslint/no-empty-function
export function noop(){}

export async function retry<T>(fn: () => T, config={timeout: 1000, retries:3}){
  let retryNo = 0
  const { retries, timeout } = config
  while (retryNo < retries) {
    retryNo ++
    try {
      return await fn()
    } catch (e) {
      console.warn(`fn failed, retry after ${timeout} milliseconds`)
      await (() => new Promise(rs => setTimeout(rs, timeout)))()
    }
  }
  throw new Error(`fn failed ${retries} times, aborting`)
}

export async function getExportNehuba() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const nehuba = (window as any).export_nehuba
    if (!!nehuba) return nehuba
    await new Promise((rs) => setTimeout(rs, 160))
  }
}

export function getUuid(){
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(16)
}

type TPrimitive = string | number

export const arrayOfPrimitiveEqual = <T extends TPrimitive>(o: T[], n: T[]) =>
  o.length === n.length &&
  o.every((el, idx) => n[idx] === el)

interface ISwitchMapWaitFor {
  interval?: number
  leading?: boolean
  condition: (arg?: any) => boolean
}
export function switchMapWaitFor<T>(opts: ISwitchMapWaitFor){
  return (arg: T) => {
    if (opts.leading && opts.condition(arg)) return of(arg)
    return interval(opts.interval || 16).pipe(
      filter(() => opts.condition(arg)),
      take(1),
      mapTo(arg)
    )
  }
}


type TCacheFunctionArg = {
  serialization?: (...arg: any[]) => string
}

/**
 * member function decorator
 * can only be used to decorate arguementless async function
 * 
 */

export const cachedPromise = <T>() => {
  const key = Symbol('cachedpromise')
  return (_target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<() => Promise<T>>) => {
    const originalMethod = descriptor.value
    descriptor.value = function() {
      if (key in this) {
        /**
         * if cached promise exist, return cached promise
         */
        return this[key]
      }
      const cleanup = () => {
        /**
         * on cleanup, delete the stored instance
         */
        delete this[key]
      }
      const pr = new Promise<T>((rs, rj) => {
        originalMethod.apply(this, [])
          .then((val: T) => {
            cleanup()
            rs(val)
          })
          .catch((e: Error) => {
            cleanup()
            rj(e)
          })
      })
      /**
       * store the promise as a property of the instance
       */
      this[key] = pr
      return pr
    }
  }
}

/**
 * Member function decorator
 * Multiple function calls with strictly equal arguments will return cached result
 * @returns cached result if exists, else call original function
 */
export const CachedFunction = (config?: TCacheFunctionArg) => {
  const { serialization } = config || {}
  const cache = {}
  const cachedValKeySym = Symbol('cachedValKeySym')
  return (_target: Record<string, any>, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    descriptor.value = function(...args: any[]) {
      let found = cache
      if (serialization) {
        const key = serialization(...args)
        if (!cache[key]) cache[key] = {}
        found = cache[key]
      } else {
        for (const arg of args) {
          if (!cache[arg]) cache[arg] = {}
          found = cache[arg]
        }
      }
      if (found[cachedValKeySym]) return found[cachedValKeySym]
      const returnVal = originalMethod.apply(this, args)
      found[cachedValKeySym] = returnVal
      return returnVal
    }
  }
}

// A quick, non secure hash function
export class QuickHash {
  private length = 6
  constructor(opts?: any){
    if (opts?.length) this.length = opts.length
  }

  static GetHash(str: string) {
    let hash = 0
    for (const char of str) {
      const charCode = char.charCodeAt(0)
      hash = ((hash << 5) - hash) + charCode
      hash = hash & hash
    }
    return hash.toString(16).slice(1)
  }

  @CachedFunction()
  getHash(str: string){
    return QuickHash.GetHash(str)
  }
}

// fsaverage uses threesurfer, which, whilst do not use ngId, uses 'left' and 'right' as keys 
const fsAverageKeyVal = {
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290": {
    "left hemisphere": "left",
    "right hemisphere": "right"
  }
}

/**
 * in order to maintain backwards compat with url encoding of selected regions
 * TODO setup a sentry to catch if these are ever used. if not, retire the hard coding 
 */
const BACKCOMAP_KEY_DICT = {

  // human multi level
  'juelich/iav/atlas/v1.0.0/1': {
    // icbm152
    'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2': {
      // julich brain v2.6
      'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26': {
        'left hemisphere': 'MNI152_V25_LEFT_NG_SPLIT_HEMISPHERE',
        'right hemisphere': 'MNI152_V25_RIGHT_NG_SPLIT_HEMISPHERE'
      },
      // bundle hcp
      // even though hcp, long/short bundle, and difumo has no hemisphere distinctions, the way siibra-python parses the region,
      // and thus attributes left/right hemisphere, still results in some regions being parsed as left/right hemisphere
      "juelich/iav/atlas/v1.0.0/79cbeaa4ee96d5d3dfe2876e9f74b3dc3d3ffb84304fb9b965b1776563a1069c": {
        "whole brain": "superficial-white-bundle-HCP",
        "left hemisphere": "superficial-white-bundle-HCP",
        "right hemisphere": "superficial-white-bundle-HCP"
      },
      // julich brain v1.18
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579": {
        "left hemisphere": "jubrain mni152 v18 left",
        "right hemisphere": "jubrain mni152 v18 right",
      },
      // long bundle
      "juelich/iav/atlas/v1.0.0/5": {
        "whole brain": "fibre bundle long",
        "left hemisphere": "fibre bundle long",
        "right hemisphere": "fibre bundle long",
      },
      // bundle short
      "juelich/iav/atlas/v1.0.0/6": {
        "whole brain": "fibre bundle short",
        "left hemisphere": "fibre bundle short",
        "right hemisphere": "fibre bundle short",
      },
      // difumo 64
      "minds/core/parcellationatlas/v1.0.0/d80fbab2-ce7f-4901-a3a2-3c8ef8a3b721": {
        "whole brain": "DiFuMo Atlas (64 dimensions)",
        "left hemisphere": "DiFuMo Atlas (64 dimensions)",
        "right hemisphere": "DiFuMo Atlas (64 dimensions)",
      },
      "minds/core/parcellationatlas/v1.0.0/73f41e04-b7ee-4301-a828-4b298ad05ab8": {
        "whole brain": "DiFuMo Atlas (128 dimensions)",
        "left hemisphere": "DiFuMo Atlas (128 dimensions)",
        "right hemisphere": "DiFuMo Atlas (128 dimensions)",
      },
      "minds/core/parcellationatlas/v1.0.0/141d510f-0342-4f94-ace7-c97d5f160235": {
        "whole brain": "DiFuMo Atlas (256 dimensions)",
        "left hemisphere": "DiFuMo Atlas (256 dimensions)",
        "right hemisphere": "DiFuMo Atlas (256 dimensions)",
      },
      "minds/core/parcellationatlas/v1.0.0/63b5794f-79a4-4464-8dc1-b32e170f3d16": {
        "whole brain": "DiFuMo Atlas (512 dimensions)",
        "left hemisphere": "DiFuMo Atlas (512 dimensions)",
        "right hemisphere": "DiFuMo Atlas (512 dimensions)",
      },
      "minds/core/parcellationatlas/v1.0.0/12fca5c5-b02c-46ce-ab9f-f12babf4c7e1": {
        "whole brain": "DiFuMo Atlas (1024 dimensions)",
        "left hemisphere": "DiFuMo Atlas (1024 dimensions)",
        "right hemisphere": "DiFuMo Atlas (1024 dimensions)",
      },
    },
    // colin 27
    "minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992": {
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26": {
        "left hemisphere": "COLIN_V25_LEFT_NG_SPLIT_HEMISPHERE",
        "right hemisphere": "COLIN_V25_RIGHT_NG_SPLIT_HEMISPHERE",
      },
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579": {
        "left hemisphere": "jubrain colin v18 left",
        "right hemisphere": "jubrain colin v18 right",
      }
    },
    // big brain
    "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588": {
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26": {

      },
      // isocortex
      "juelich/iav/atlas/v1.0.0/4": {
        "whole brain": " tissue type: "
      },
      // cortical layers
      "juelich/iav/atlas/v1.0.0/3": {
        "whole brain": "cortical layers"
      },
    },

    // fsaverage
    "minds/core/referencespace/v1.0.0/tmp-fsaverage": fsAverageKeyVal,
  },
  // allen mouse
  'juelich/iav/atlas/v1.0.0/2': {
    // ccf v3
    "minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9": {
      // ccf v3 2017
      "minds/core/parcellationatlas/v1.0.0/05655b58-3b6f-49db-b285-64b5a0276f83": {
        "whole brain": "v3_2017",
        "left hemisphere": "v3_2017",
        "right hemisphere": "v3_2017"
      },
      // ccf v3 2015,
      "minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f": {
        "whole brain": "atlas",
        "left hemisphere": "atlas",
        "right hemisphere": "atlas"
      }
    }
  },
  // waxholm
  "minds/core/parcellationatlas/v1.0.0/522b368e-49a3-49fa-88d3-0870a307974a": {
    "minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8": {
      // v1.01
      "minds/core/parcellationatlas/v1.0.0/11017b35-7056-4593-baad-3934d211daba": {
        "whole brain": "v1_01",
        "left hemisphere": "v1_01",
        "right hemisphere": "v1_01"
      },
      // v2
      "minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d": {
        "whole brain": "v2",
        "left hemisphere": "v2",
        "right hemisphere": "v2"
      },
      // v3
      "minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe": {
        "whole brain": "v3",
        "left hemisphere": "v3",
        "right hemisphere": "v3"
      }
    }
  }
}

export class MultiDimMap{
  
  private map = new Map()

  static KeyHash = new QuickHash()

  static GetProxyKeyMatch(...arg: any[]): string {

    let proxyKeyMatch = BACKCOMAP_KEY_DICT
    for (let i = 0; i < arg.length; i++) {
      if (proxyKeyMatch) proxyKeyMatch = proxyKeyMatch[arg[i]]
    }
    if (proxyKeyMatch) return proxyKeyMatch as any
    return null
  }

  static GetKey(...arg: any[]){
    let mapKey = ``
    for (let i = 0; i < arg.length; i++) {
      mapKey += arg[i]
    }
    return MultiDimMap.KeyHash.getHash(mapKey)
  }

  set(...arg: any[]) {
    const mapKey = MultiDimMap.GetKey(...(arg.slice(0, -1)))
    this.map.set(mapKey, arg[arg.length - 1])
  }
  get(...arg: any[]) {
    const mapKey = MultiDimMap.GetKey(...arg)
    return this.map.get(mapKey)
  }
  delete(...arg: any[]) {
    const mapKey = MultiDimMap.GetKey(...arg)
    return this.map.delete(mapKey)
  }
}

export function mutateDeepMerge(toObj: any, fromObj: any){
  if (typeof toObj !== 'object') throw new Error(`toObj needs to be object`)
  if (typeof fromObj !== 'object') throw new Error(`fromObj needs to be object`)

  for (const key in fromObj) {
    if (!toObj[key]) {
      toObj[key] = fromObj[key]
      continue
    }
    if (Array.isArray(toObj[key])) {
      toObj[key] = fromObj[key]
      continue
    }
    const toObjType = typeof toObj[key]
    if (toObjType === typeof fromObj[key] && toObjType === 'object') {
      mutateDeepMerge(toObj[key], fromObj[key])
      continue
    }
    
    if (["boolean", "string", "number"].includes(toObjType)) {
      toObj[key] = fromObj[key]
      continue
    }
    
    throw new Error(`cannot mutate ${key} typeof ${typeof fromObj[key]}`)
  }
  
  return toObj
}

export function recursiveMutate<T>(arr: T[], getChildren: (obj: T) => T[], mutateFn: (obj: T) => void, depthFirst = false){
  for (const obj of arr) {
    if (!depthFirst) mutateFn(obj)
    recursiveMutate(
      getChildren(obj),
      getChildren,
      mutateFn
    )
    if (depthFirst) mutateFn(obj)
  }
}

export function bufferUntil<T>(opts: ISwitchMapWaitFor) {
  const { condition, leading, interval: int = 160 } = opts
  let buffer: T[] = []
  return (src: Observable<T>) => new Observable<T[]>(obs => {
    const sub = interval(int).pipe(
      filter(() => buffer.length > 0)
    ).subscribe(() => {
      if (condition()) {
        obs.next(buffer)
        buffer = []
      }
    })
    src.subscribe(
      val => {
        if (leading && condition()) {
          obs.next([...buffer, val])
          buffer = []
        } else {
          buffer.push(val)
        }
      },
      err => obs.error(err),
      () => {
        obs.complete()
        sub.unsubscribe()
      }
    )
  })
}

export function defaultdict<T>(fn: () => T): Record<string, T> {
  const obj = {}
  return new Proxy(obj, {
    get(target, prop, _rec) {
      if (!(prop in target)){
        target[prop] = fn()
      }
      return obj[prop]
    },
  })
}

export function wait(ms: number){
  return new Promise(rs => setTimeout(() => {
    rs(null)
  }, ms))
}

/**
 * @description Wait until predicate returns true. Tries once every 16 ms.
 * @param predicate 
 */
export async function waitFor(predicate: () => boolean) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (predicate()) break
    await wait(16)
  }
}
/**
 * copied from ng-layer-tune@0.0.22
 * TODO export to an individual component/library
 * OR use monorepo
 */
const cmEncodingVersion = 'encodedCmState-0.1'

type TGetShaderCfg = {
  colormap: EnumColorMapName
  lowThreshold: number
  highThreshold: number
  brightness: number
  contrast: number
  removeBg: boolean
  hideZero: boolean
  opacity: number
}

export function decodeBool(num: number) {
  const rBool: boolean[] = []
  for (let i = 0; i < 8; i ++) {
    rBool.push( ((num >> i) & 1) === 1 )
  }
  return rBool
}

export function encodeBool(...flags: boolean[]) {
  if (flags.length > 8) {
    throw new Error(`encodeBool can only handle upto 8 bools`)
  }
  let rValue = 0
  flags.forEach((flag, idx) => {
    if (flag) {
      rValue += (1 << idx)
    }
  })
  return rValue
}


export function encodeState(cfg: TGetShaderCfg): string {
  const {
    brightness,
    colormap,
    contrast,
    hideZero,
    highThreshold,
    lowThreshold,
    opacity,
    removeBg
  } = cfg

  /**
   * encode Enum as key of Enum
   */
  const cmstring = Object.keys(EnumColorMapName).find(v => EnumColorMapName[v] === colormap)

  const array = new Float32Array([
    brightness,
    contrast,
    lowThreshold,
    highThreshold,
    opacity,
    encodeBool(hideZero, removeBg)
  ])
  
  const encodedVal = window.btoa(new Uint8Array(array.buffer).reduce((data, v) => data + String.fromCharCode(v), ''))
  return `${cmEncodingVersion}:${cmstring}:${encodedVal}`
}

export const getShader = ({
  colormap = EnumColorMapName.GREYSCALE,
  lowThreshold = 0,
  highThreshold = 1,
  brightness = 0,
  contrast = 0,
  removeBg = false
} = {}): string => {
  const { header, main, premain, override } = mapKeyColorMap.get(colormap) || (() => {
    return mapKeyColorMap.get(EnumColorMapName.GREYSCALE)
  })()

  const encodedStr = encodeState({
    colormap,
    brightness,
    highThreshold,
    lowThreshold,
    contrast,
    hideZero: false,
    opacity: 1.0,
    removeBg: false
  })

  if (override) {
    return `// ${encodedStr}\n${override()}`
  }

  // so that if lowthreshold is defined to be 0, at least some background removal will be done
  const _lowThreshold = lowThreshold + 1e-10
  return `// ${encodedStr}
${header}
${premain}
void main() {
  float raw_x = toNormalized(getDataValue());
  float x = (raw_x - ${_lowThreshold.toFixed(10)}) / (${highThreshold - _lowThreshold}) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};

  ${ removeBg ? 'if(x>1.0){emitTransparent();}else if(x<0.0){emitTransparent();}else{' : '' }
    vec3 rgb;
    ${main}
    emitRGB(rgb*exp(${contrast.toFixed(10)}));
  ${ removeBg ? '}' : '' }
}
`
}

export function getShaderFromMeta(meta: MetaV1Schema){
  let colormap = EnumColorMapName.GREYSCALE

  if (meta?.data?.type === "image/3d") {
    colormap = EnumColorMapName.RGB
  } else {
    for (const _colormap of meta?.preferredColormap || []) {
      if (_colormap in CMByName) {
        colormap = CMByName[_colormap]
        break
      }
    }
  }

  let low: number = 0
  let high: number = 1

  if (meta?.data?.type === "image/1d") {
    const { max, min } = meta.data.range?.[0] || { min: 0, max: 1 }
    low = min
    high = max
  }
  
  return getShader({
    colormap,
    lowThreshold: low,
    highThreshold: high
  })
}

export function isNullish(v: unknown){
  return v === null || typeof v === "undefined"
}

export function isWheelEvent(e: unknown): e is WheelEvent{
  const { deltaX, deltaY } = (e || {}) as any
  return !isNullish(deltaX) && !isNullish(deltaY)
}

/**
 * @description compare if two geometry (face index or point) equal each other
 * @param o 
 * @param n 
 * @returns {boolean}
 */
export function geometryEqual(o: TFace|TSandsPoint, n: TFace|TSandsPoint): boolean {
  if (o?.['@type'] !== n?.['@type']) {
    return false
  }
  if (
    o?.['@type'] === "https://openminds.ebrains.eu/sands/CoordinatePoint" 
    && n?.['@type'] === "https://openminds.ebrains.eu/sands/CoordinatePoint" 
  ){
    return [0, 1, 2].every(idx => 
      o.coordinates[idx].value === n.coordinates[idx].value
    )
  }
  if (
    o?.['@type'] === "siibra-explorer/surface/face" 
    && n?.['@type'] === "siibra-explorer/surface/face" 
  ) {
    return o.face === n.face
  }
  return true
}
