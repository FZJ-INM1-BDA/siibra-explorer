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

export const SET_COLORMAP_OBS = new InjectionToken<Observable<IColorMap>>('SET_COLORMAP_OBS')
export const SET_LAYER_VISIBILITY = new InjectionToken<Observable<string[]>>('SET_LAYER_VISIBILITY')
