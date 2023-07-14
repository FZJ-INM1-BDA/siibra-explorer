import { TabularFeature, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes"

export function isTabularData(feature: unknown): feature is TabularFeature<number|string|number[]> {
  return !!feature['index'] && !!feature['columns']
}

export function isVoiData(feature: unknown): feature is VoiFeature {
  return !!feature['bbox']
}

export function notQuiteRight(_feature: unknown): string[] {
  return []
}
