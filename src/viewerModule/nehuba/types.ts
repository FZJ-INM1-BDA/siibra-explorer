import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
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
    regions: SxplrRegion[]
  }[]
}
