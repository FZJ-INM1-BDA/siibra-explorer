import { InjectionToken } from '@angular/core'
import { Observable } from 'rxjs'
import { SXPLR_PREFIX } from 'src/util/constants'

export const NEHUBA_VIEWER_FEATURE_KEY = 'ngViewerFeature'

export interface IRegion {
  [key: string]: any
  ngId: string
  rgb?: [number, number, number]
}

export interface IMeshesToLoad {
  labelIndicies: number[]
  layer: {
    name: string
  }
}

export type TVec4 = number[]
export type TVec3 = number[]

export interface INavObj {
  position: TVec3
  orientation: TVec4
  perspectiveOrientation: TVec4
  perspectiveZoom: number
  zoom: number
}

export type TNehubaViewerUnit = {
  viewerPositionChange: Observable<INavObj>
  setNavigationState(nav: Partial<INavObj> & { positionReal?: boolean }): void
}

export const SET_MESHES_TO_LOAD = new InjectionToken<Observable<IMeshesToLoad>>('SET_MESHES_TO_LOAD')

export const PMAP_LAYER_NAME = `${SXPLR_PREFIX}regional-pmap`

/**
 * since export_nehuba@0.1.0 onwards (the big update that changed a lot of neuroglancer's internals)
 * there is now a multiplier bewteen old and new perspective views
 * to maintain interop with previous states, translate the multiplier
 */
export const PERSPECTIVE_ZOOM_FUDGE_FACTOR = 82.842712474619
