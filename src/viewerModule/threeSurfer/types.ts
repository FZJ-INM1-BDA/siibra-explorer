import { IContext } from './util'

export type TThreeSurferMesh = {
  colormap: string
  mesh: string
}

export type TThreeSurferMode = {
  name: string
  meshes: TThreeSurferMesh[]
}

export type TThreeSurferConfig = {
  ['@context']: IContext
  modes: TThreeSurferMode[]
}
