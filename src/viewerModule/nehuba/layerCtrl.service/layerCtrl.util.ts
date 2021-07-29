import { InjectionToken } from '@angular/core'
import { strToRgb } from 'common/util'
import { Observable } from 'rxjs'

export interface IColorMap {
  [key: string]: {
    [key: number]: {
      red: number
      green: number
      blue: number
    }
  }
}

export function getRgb(labelIndex: number, region: { rgb?: [number, number, number], ngId: string }): {red: number, green: number, blue: number} {
  const { rgb, ngId } = region
  if (typeof rgb === 'undefined' || rgb === null) {
    if (labelIndex > 65500) {
      return {
        red: 255,
        green: 255,
        blue: 255
      }
    }
    const arr = strToRgb(`${ngId}${labelIndex}`)
    return {
      red : arr[0],
      green: arr[1],
      blue : arr[2],
    }
  }
  return {
    red : rgb[0],
    green: rgb[1],
    blue : rgb[2],
  }
}


export interface INgLayerCtrl {
  remove: {
    names: string[]
  }
  add: {
    [key: string]: INgLayerInterface
  }
  update: {
    [key: string]: INgLayerInterface
  }
  setLayerTransparency: {
    [key: string]: number
  }
}

export type TNgLayerCtrl<T extends keyof INgLayerCtrl> = {
  type: T
  payload: INgLayerCtrl[T]
}

export const SET_COLORMAP_OBS = new InjectionToken<Observable<IColorMap>>('SET_COLORMAP_OBS')
export const SET_LAYER_VISIBILITY = new InjectionToken<Observable<string[]>>('SET_LAYER_VISIBILITY')
export const SET_SEGMENT_VISIBILITY = new InjectionToken<Observable<string[]>>('SET_SEGMENT_VISIBILITY')
export const NG_LAYER_CONTROL = new InjectionToken<TNgLayerCtrl<keyof INgLayerCtrl>>('NG_LAYER_CONTROL')

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
