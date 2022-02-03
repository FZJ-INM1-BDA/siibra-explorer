import { IVolumeTypeDetail } from "src/util/siibraApiConstants/types"

export type IdName = {
  id: string
  name: string
}

type Point = [number, number, number]
type Volume = {
  id: string
  name: string
  url: string
  volume_type: "neuroglancer/precomputed",
  detail: {
    "neuroglancer/precomputed": IVolumeTypeDetail["neuroglancer/precomputed"]
  }
}

export type BoundingBoxConcept = [Point, Point]

export type SapiVoiResponse = {
  "@id": string
  name: string
  description: string
  urls: {
    cite?: string
    doi: string
  }[]
  location: {
    space: {
      "@id": string
      center: Point
      minpoint: Point
      maxpoint: Point
    }
  }
  volumes: Volume[]
}
