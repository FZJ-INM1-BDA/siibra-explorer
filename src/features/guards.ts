import { TabularFeature, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes"

export function isTabularData(feature: unknown): feature is TabularFeature<number|string|number[]> {
  return !!feature['index'] && !!feature['columns']
}

export function isVoiData(feature: unknown): feature is VoiFeature {
  return !!feature['bbox']
}

export function notQuiteRight(feature: unknown): string[] {
  if (feature['name'].includes("Cellular level 3D reconstructed volumes at 1µm resolution")) {
    return [
      "This volume is currently not displayed correctly. We are working to restore the functionality."
    ]
  }
  return []
}
