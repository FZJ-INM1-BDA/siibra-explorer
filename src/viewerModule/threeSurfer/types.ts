import { SxplrRegion } from 'src/atlasComponents/sapi/sxplrTypes'

export type TThreeSurferMesh = {
  colormap: string
  mesh: string
  hemisphere: 'left' | 'right'
}

export type TThreeMesh = {
  id: string
  variant: string
  space: string
  url: string
  laterality: 'left' | 'right'
}

export type TThreeMeshLabel = {
  url: string
  space: string
  laterality: 'left' | 'right'
}

export type TThreeSurferContextInfo = {
  position: number[]
  faceIndex: number
  vertexIndices: number[]
  fsversion: string
  regions: SxplrRegion[]
  error?: string
}
