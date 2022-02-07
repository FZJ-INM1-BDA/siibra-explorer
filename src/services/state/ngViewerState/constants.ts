export interface INgLayerInterface {
  name: string // displayName
  source: string
  mixability?: string //"base" | "mixable" | "nonmixable"
  annotation?: string //
  id?: string // unique identifier
  visible?: boolean
  shader?: string
  transform?: any
  opacity?: number
}

export enum PANELS {
  FOUR_PANEL = 'FOUR_PANEL',
  V_ONE_THREE = 'V_ONE_THREE',
  H_ONE_THREE = 'H_ONE_THREE',
  SINGLE_PANEL = 'SINGLE_PANEL',
}
