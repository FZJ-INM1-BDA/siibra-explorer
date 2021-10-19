import { TRegionDetail } from "./types";

export function getPosFromRegion(region: TRegionDetail){
  if (!!region?.props?.components?.[0]?.centroid) {
    return region.props.components[0].centroid.map(v => v*1e6) as [number, number, number]  
  }
  return null
}