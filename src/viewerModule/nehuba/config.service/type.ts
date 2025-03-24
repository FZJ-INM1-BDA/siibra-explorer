import { MetaV1Schema } from "src/atlasComponents/sapi/volumeMeta"

export type RecursivePartial<T> = {
  [K in keyof T]?: RecursivePartial<T[K]>
}

type Vec4 = [number, number, number, number]
type Vec3 = [number, number, number]

export type NgConfigViewerState = {
  perspectiveOrientation: Vec4
  perspectiveZoom: number
  navigation: {
    pose: {
      position: {
        voxelSize: Vec3
        voxelCoordinates: Vec3
      }
      orientation: Vec4
    }
    zoomFactor: number
  }
}

export type NgConfig = {
  showDefaultAnnotations: boolean
  layers: Record<string, NgLayerSpec>
  gpuMemoryLimit: number
} & NgConfigViewerState


export type NehubaConfig = MetaV1Schema["https://schema.brainatlas.eu/github/humanbrainproject/nehuba"]["config"]

type OldNgLayerSpec = {
  legacySpecFlag: 'old'
  source: string
  transform: number[][]
  info?: {
    voxel: [number, number, number]
    real: [number, number, number]
  }
  opacity?: number
  visible?: boolean
  shader?: string
}

type NewNgLayerSpec = {
  legacySpecFlag: 'new'
  type: 'image'
  name: string
  blend: 'default' | 'additive'
  visible: boolean
  source: {
    url: string
    transform: {
      inputDimensions: Record<string, [number, string]>
      outputDimensions: Record<string, [number, string]>
      matrix: number[][]
      sourceRank: number
    }
  }
  shader?: string
}

/**
 * source MUST contain format, e.g. precomputed://
 */
export type NgLayerSpec =  NewNgLayerSpec | OldNgLayerSpec

/**
 * source MUST contain format, e.g. precomputed://
 */
export type NgPrecompMeshSpec = {
  auxMeshes: {
    name: string
    labelIndicies: number[]
  }[]
} & NgLayerSpec

/**
 * source MUST contain format, e.g. precomputed://
 */
export type NgSegLayerSpec = {
  labelIndicies: number[]
} & NgLayerSpec
