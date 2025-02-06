import { InjectionToken } from '@angular/core'
import { Observable } from 'rxjs'
import { IDS } from 'src/atlasComponents/sapi'

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

/**
 * since export_nehuba@0.1.0 onwards (the big update that changed a lot of neuroglancer's internals)
 * there is now a multiplier bewteen old and new perspective views
 * to maintain interop with previous states, translate the multiplier
 */
export const PERSPECTIVE_ZOOM_FUDGE_FACTOR = 82.842712474619

type AtlasInfo = {
  templateId: string
  voxelSizes: number[]
  voxelTransform: number[]
}

const waxholm: AtlasInfo = {
  templateId: IDS.TEMPLATES.WAXHOLM,
  voxelSizes: [3.90625e4, 3.90625e4, 3.90625e4],
  voxelTransform: [244, 623, 248]
}

const ambaCcfV3: AtlasInfo = {
  templateId: IDS.TEMPLATES.AMBA_CCF_V3,
  voxelSizes: [2.5e4, 2.5e4, 2.5e4],
  voxelTransform: [229, 265, 161],
}

export const VOXEL_SIZE_MAP: Record<string, AtlasInfo> = {
  "WHS_Rat_v2_39um.cutlas": waxholm,
  "WHS_Rat_v3_39um.cutlas": waxholm,
  "WHS_Rat_v4_39um.cutlas": waxholm,
  "ABA_Mouse_CCFv3_2015_25um.cutlas": ambaCcfV3,
  "ABA_Mouse_CCFv3_2017_25um.cutlas": ambaCcfV3,
}
