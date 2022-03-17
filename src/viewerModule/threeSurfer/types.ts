import { SapiRegionModel } from 'src/atlasComponents/sapi'

export type TThreeSurferMesh = {
  colormap: string
  mesh: string
  hemisphere: 'left' | 'right'
}

export type TThreeSurferContextInfo = {
  position: number[]
  faceIndex: number
  vertexIndices: number[]
  fsversion: string
  regions: SapiRegionModel[]
  error?: string
}
