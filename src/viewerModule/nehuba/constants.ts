import { InjectionToken } from '@angular/core'
import { Observable } from 'rxjs'

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

export const PMAP_LAYER_NAME = 'regional-pmap'
