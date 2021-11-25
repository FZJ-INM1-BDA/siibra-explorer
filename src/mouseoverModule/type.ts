import { TRegionSummary } from "src/util/siibraApiConstants/types";

export type TMouseOverSegment = {
  layer: {
    name: string
  }
  segmentId: number
  segment: TRegionSummary | string // if cannot decode, then segment will be {ngId}#{labelIndex}
}

export type TMouseOverVtkLandmark = {
  landmarkName: string
}