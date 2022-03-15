import { IContext } from './util'

export type TThreeSurferMesh = {
  colormap: string
  mesh: string
  hemisphere: 'left' | 'right'
}

export type TThreeSurferMode = {
  name: string
  meshes: TThreeSurferMesh[]
}

export type TThreeSurferConfig = {
  ['@context']: IContext
  modes: TThreeSurferMode[]
}

export type TThreeSurferContextInfo = {
  position: number[]
  faceIndex: number
  vertexIndices: number[]
  fsversion: string
  _mouseoverRegion: { name: string, error?: string }[]
}
