import { deserialiseParcRegionId } from 'common/util'
import { interval } from 'rxjs'
import { filter, mapTo, take } from 'rxjs/operators'

export function isSame(o, n) {
  if (!o) { return !n }
  return o === n || (o && n && o.name === n.name)
}

export function getViewer() {
  return (window as any).viewer
}

export function setViewer(viewer) {
  (window as any).viewer = viewer
}

export function setNehubaViewer(nehubaViewer) {
  (window as any).nehubaViewer = nehubaViewer
}

export function getDebug() {
  return (window as any).__DEBUG__
}

export function getExportNehuba() {
  return (window as any).export_nehuba
}

export function getNgIds(regions: any[]): string[] {
  return regions && regions.map
    ? regions
      .map(r => [r.ngId, ...getNgIds(r.children)])
      .reduce((acc, item) => acc.concat(item), [])
      .filter(ngId => !!ngId)
    : []
}

const recursiveFlatten = (region, {ngId}) => {
  return [{
    ngId,
    ...region,
  }].concat(
    ...((region.children && region.children.map && region.children.map(c => recursiveFlatten(c, { ngId : region.ngId || ngId })) ) || []),
  )
}

export function recursiveFindRegionWithLabelIndexId({ regions, labelIndexId, inheritedNgId = 'root' }: {regions: any[], labelIndexId: string, inheritedNgId: string}) {
  const { ngId, labelIndex } = deserialiseParcRegionId( labelIndexId )
  const fr1 = regions.map(r => recursiveFlatten(r, { ngId: inheritedNgId }))
  const fr2 = fr1.reduce((acc, curr) => acc.concat(...curr), [])
  const found = fr2.find(r => r.ngId === ngId && Number(r.labelIndex) === Number(labelIndex))
  if (found) { return found }
  return null
}

export function getUuid(){
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(16)
}

export const getGetRegionFromLabelIndexId = ({ parcellation }) => {
  const { ngId: defaultNgId, regions } = parcellation
  // if (!updated) throw new Error(`parcellation not yet updated`)
  return ({ labelIndexId }) =>
    recursiveFindRegionWithLabelIndexId({ regions, labelIndexId, inheritedNgId: defaultNgId })
}

type TPrimitive = string | number

const include = <T extends TPrimitive>(el: T, arr: T[]) => arr.indexOf(el) >= 0
export const arrayOfPrimitiveEqual = <T extends TPrimitive>(o: T[], n: T[]) =>
  o.every(el => include(el, n))
  && n.every(el => include(el, o))

interface ISwitchMapWaitFor {
  interval?: number
  condition: () => boolean
}
export function switchMapWaitFor(opts: ISwitchMapWaitFor){
  return (arg: unknown) => interval(opts.interval || 16).pipe(
    filter(() => opts.condition()),
    take(1),
    mapTo(arg)
  )
}


type TCacheFunctionArg = {
  serialization?: (...arg: any[]) => string
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

// A quick, non security hash function
export class QuickHash {
  private length = 6
  constructor(opts?: any){
    if (opts?.length) this.length = opts.length
  }

  @CachedFunction()
  getHash(str: string){
    let hash = 0
    for (const char of str) {
      const charCode = char.charCodeAt(0)
      hash = ((hash << 5) - hash) + charCode
      hash = hash & hash
    }
    return hash.toString(16).slice(1, this.length+1)
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
      'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-25': {
        'left hemisphere': 'MNI152_V25_LEFT_NG_SPLIT_HEMISPHERE',
        'right hemisphere': 'MNI152_V25_RIGHT_NG_SPLIT_HEMISPHERE'
      },
      // bundle hcp
      "juelich/iav/atlas/v1.0.0/79cbeaa4ee96d5d3dfe2876e9f74b3dc3d3ffb84304fb9b965b1776563a1069c": {
        "whole brain": "superficial-white-bundle-HCP"
      },
      // julich brain v1.18
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579": {
        "left hemisphere": "jubrain mni152 v18 left",
        "right hemisphere": "jubrain mni152 v18 right",
      },
      // long bundle
      "juelich/iav/atlas/v1.0.0/5": {
        "whole brain": "fibre bundle long"
      },
      // bundle short
      "juelich/iav/atlas/v1.0.0/6": {
        "whole brain": "fibre bundle short"
      },
      // difumo 64
      "minds/core/parcellationatlas/v1.0.0/d80fbab2-ce7f-4901-a3a2-3c8ef8a3b721": {
        "whole brain": "DiFuMo Atlas (64 dimensions)"
      },
      "minds/core/parcellationatlas/v1.0.0/73f41e04-b7ee-4301-a828-4b298ad05ab8": {
        "whole brain": "DiFuMo Atlas (128 dimensions)"
      },
      "minds/core/parcellationatlas/v1.0.0/141d510f-0342-4f94-ace7-c97d5f160235": {
        "whole brain": "DiFuMo Atlas (256 dimensions)"
      },
      "minds/core/parcellationatlas/v1.0.0/63b5794f-79a4-4464-8dc1-b32e170f3d16": {
        "whole brain": "DiFuMo Atlas (512 dimensions)"
      },
      "minds/core/parcellationatlas/v1.0.0/12fca5c5-b02c-46ce-ab9f-f12babf4c7e1": {
        "whole brain": "DiFuMo Atlas (1024 dimensions)"
      },
    },
    // colin 27
    "minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992": {
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-25": {
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
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-25": {

      },
      // isocortex
      "juelich/iav/atlas/v1.0.0/4": {
        "whole brain": " tissue type: "
      },
      // cortical layers
      "juelich/iav/atlas/v1.0.0/3": {
        "whole brain": "cortical layers"
      },
    }
  }
}

export class MultiDimMap{
  
  private map = new Map()

  static KeyHash = new QuickHash()

  static GetKey(...arg: any[]){
    let mapKey = ``
    let proxyKeyMatch = BACKCOMAP_KEY_DICT
    for (let i = 0; i < arg.length; i++) {
      if (proxyKeyMatch) proxyKeyMatch = proxyKeyMatch[arg[i]]
      mapKey += arg[i]
    }
    if (proxyKeyMatch) return proxyKeyMatch
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

export function recursiveMutate<T>(arr: T[], getChildren: (obj: T) => T[], mutateFn: (obj: T) => void){
  for (const obj of arr) {
    mutateFn(obj)
    recursiveMutate(
      getChildren(obj),
      getChildren,
      mutateFn
    )
  }
}
