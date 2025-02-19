import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
import { INavObj } from "./constants";

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

export type Unit = 'm'
type Bound = {
  lowerBounds: Float64Array
  upperBounds: Float64Array
}
type BBox = {
  transform: Float64Array
  box: Bound
}

export type NgCoordinateSpace = {
  valid: boolean
  rank: number
  names: string[]
  timestamps: number[]
  ids: number[]
  units: Unit[]
  scales: Float64Array
  boundingBoxes:BBox[]
  bounds: Bound
}
