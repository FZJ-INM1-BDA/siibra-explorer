export interface IAuxMesh {
  ['@id']: string
  name: string
  displayName?: string
  ngId: string
  labelIndicies: number[]
  rgb: [number, number, number]
  visible: boolean
}

export interface INgLayerInterface {
  name: string // displayName
  source: string
  mixability: string // base | mixable | nonmixable
  annotation?: string //
  id?: string // unique identifier
  visible?: boolean
  shader?: string
  transform?: any
}

export interface INehubaFeature {
  layers: INgLayerInterface[]
  panelMode: string
  panelOrder: string
  octantRemoval: boolean
  clearViewQueue: {
    [key: string]: boolean
  }
  auxMeshes: IAuxMesh[]
}
