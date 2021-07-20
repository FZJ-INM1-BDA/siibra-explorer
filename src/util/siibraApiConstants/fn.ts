import { TRegionDetail } from "./types";

export function getPosFromRegion(region: TRegionDetail){
  if (!region?.props?.[0]) return null
  return region.props[0].centroid_mm.map(v => v*1e6) as [number, number, number]
}