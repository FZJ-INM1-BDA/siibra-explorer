import { atlasAppearance } from "src/state"

export interface IAuxMesh {
  ['@id']: string
  name: string
  displayName?: string
  ngId: string
  labelIndicies: number[]
  rgb: [number, number, number]
  visible: boolean
}


export interface INehubaFeature {
  layers: atlasAppearance.const.NgLayerCustomLayer[]
  panelMode: string
  panelOrder: string
  octantRemoval: boolean
  clearViewQueue: {
    [key: string]: boolean
  }
  auxMeshes: IAuxMesh[]
}
