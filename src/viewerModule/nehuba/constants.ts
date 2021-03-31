import { InjectionToken } from '@angular/core'
import { Observable } from 'rxjs'

export { getNgIds } from 'src/util/fn'
export const NEHUBA_VIEWER_FEATURE_KEY = 'ngViewerFeature'

export interface INgLayerInterface {
  name: string // displayName
  source: string
  mixability: string // base | mixable | nonmixable
  annotation?: string //
  id?: string // unique identifier
  visible?: boolean
  shader?: string
  transform?: any
}

export interface IRegion {
  [key: string]: any
  ngId: string
  rgb?: [number, number, number]
}

export function getMultiNgIdsRegionsLabelIndexMap(parcellation: any = {}, inheritAttrsOpt: any = { ngId: 'root' }): Map<string, Map<number, IRegion>> {
  const map: Map<string, Map<number, any>> = new Map()
  
  const inheritAttrs = Object.keys(inheritAttrsOpt)
  if (inheritAttrs.indexOf('children') >=0 ) throw new Error(`children attr cannot be inherited`)

  const processRegion = (region: any) => {
    const { ngId: rNgId } = region
    const existingMap = map.get(rNgId)
    const labelIndex = Number(region.labelIndex)
    if (labelIndex) {
      if (!existingMap) {
        const newMap = new Map()
        newMap.set(labelIndex, region)
        map.set(rNgId, newMap)
      } else {
        existingMap.set(labelIndex, region)
      }
    }

    if (region.children && Array.isArray(region.children)) {
      for (const r of region.children) {
        const copiedRegion = { ...r }
        for (const attr of inheritAttrs){
          copiedRegion[attr] = copiedRegion[attr] || region[attr] || parcellation[attr]
        }
        processRegion(copiedRegion)
      }
    }
  }

  if (!parcellation) throw new Error(`parcellation needs to be defined`)
  if (!parcellation.regions) throw new Error(`parcellation.regions needs to be defined`)
  if (!Array.isArray(parcellation.regions)) throw new Error(`parcellation.regions needs to be an array`)

  for (const region of parcellation.regions){
    const copiedregion = { ...region }
    for (const attr of inheritAttrs){
      copiedregion[attr] = copiedregion[attr] || parcellation[attr]
    }
    processRegion(copiedregion)
  }

  return map
}

export interface IMeshesToLoad {
  labelIndicies: number[]
  layer: {
    name: string
  }
}

export const SET_MESHES_TO_LOAD = new InjectionToken<Observable<IMeshesToLoad>>('SET_MESHES_TO_LOAD')
