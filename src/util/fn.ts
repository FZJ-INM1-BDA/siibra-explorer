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

export class MultiDimMap{
  
  private map = new Map()

  static GetKey(...arg: any[]){
    let mapKey = ``
    for (let i = 0; i < arg.length; i++) {
      mapKey += arg[i]
    }
    return mapKey
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
