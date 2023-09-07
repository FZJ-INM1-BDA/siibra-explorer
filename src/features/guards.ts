import { VoiFeature } from "src/atlasComponents/sapi/sxplrTypes"


export function isVoiData(feature: unknown): feature is VoiFeature {
  return !!feature['bbox']
}

export function notQuiteRight(_feature: unknown): string[] {
  return []
}
