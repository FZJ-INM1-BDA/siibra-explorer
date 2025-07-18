import { InjectionToken } from '@angular/core'
import { strToRgb } from 'common/util'
import { Observable } from 'rxjs'
import { atlasAppearance } from 'src/state'

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
    [key: string]: atlasAppearance.const.NgLayerCustomLayer
  }
  update: {
    [key: string]: Partial<atlasAppearance.const.NgLayerCustomLayer>
  }
  setLayerTransparency: {
    [key: string]: number
  }
  updateShader: {
    [key: string]: string
  }
}

export type TNgLayerCtrl<T extends keyof INgLayerCtrl> = {
  type: T
  payload: INgLayerCtrl[T]
}

export interface IExternalLayerCtl {
  RegisterLayerName(layername: string): void
  DeregisterLayerName(layername: string): void
  readonly ExternalLayerNames: Set<string>
}

export const SET_COLORMAP_OBS = new InjectionToken<Observable<IColorMap>>('SET_COLORMAP_OBS')
export const SET_LAYER_VISIBILITY = new InjectionToken<Observable<string[]>>('SET_LAYER_VISIBILITY')
export const SET_SEGMENT_VISIBILITY = new InjectionToken<Observable<string[]>>('SET_SEGMENT_VISIBILITY')
export const NG_LAYER_CONTROL = new InjectionToken('NG_LAYER_CONTROL')
export const Z_TRAVERSAL_MULTIPLIER = new InjectionToken<Observable<number>>('Z_TRAVERSAL_MULTIPLIER')
export const CURRENT_TEMPLATE_DIM_INFO = new InjectionToken<Observable<TemplateInfo>>('CURRENT_TEMPLATE_DIM_INFO')
export const EXTERNAL_LAYER_CONTROL = new InjectionToken<IExternalLayerCtl>("EXTERNAL_LAYER_CONTROL")

export type TemplateInfo = {
  transform: number[][]
  voxel?: [number, number, number]
  real?: [number, number, number]
  resolution?: [number, number, number]
}
