import { INavObj } from "./navigation.service";

export type TNehubaContextInfo = {
  nav: INavObj
  mouse: {
    real: number[]
    voxel: number[]
  }
  nehuba: {
    layerName: string
    labelIndices: number[]
  }[]
}