import { TMat3, TVec3 } from "../types";

export interface INmvTransform {
  ['@type']: 'bas:AffineTransformation'
  fromSpace: string
  toSpace: string
  params: {
    A: TMat3
    b: TVec3
  }
}