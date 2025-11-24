import { getUuid } from "./fn"

const MM_ID_ALT = "id.link/mm" as const
export const MM_ID = "https://openminds.om-i.org/instances/unitOfMeasurement/millimeter" as const
export const MM_IDS = [ MM_ID_ALT, MM_ID ]
export const QV_T = "https://openminds.om-i.org/types/QuantitativeValue" as const
type TSandsQValue = {
  '@id': string
  '@type': typeof QV_T
  uncertainty?: [number, number]
  value: number
  unit?: {
    '@id': typeof MM_IDS[number]
  }
}

export type TSandsCoord = TSandsQValue[]


const SANDS_TYPE_ALT = "https://openminds.ebrains.eu/sands/CoordinatePoint" as const
export const SANDS_TYPE = "https://openminds.om-i.org/types/CoordinatePoint" as const
export const SANDS_TYPES = [SANDS_TYPE, SANDS_TYPE_ALT]
export function isSandsPoint(input: unknown): input is TSandsPoint {
  return SANDS_TYPES.includes(input?.["@type"])
}

export type MayHaveNameDesc = {
  'siibra:explorer'? : {
    name?: string
    desc?: string
  }
}

export type TSandsPoint = {
  coordinates: TSandsCoord
  coordinateSpace: {
    '@id': string
  }
  '@type': typeof SANDS_TYPES[number]
  '@id': string
} & MayHaveNameDesc

export type TFace = {
  face: number
  vertices: number []
  coordinateSpace: {
    '@id': string
  }
  '@type': 'siibra-explorer/surface/face'
  '@id': string
}

export function getCoord(value: number): TSandsQValue {
  return {
    '@id': getUuid(),
    '@type': QV_T,
    value,
    unit: {
      "@id": MM_ID
    }
  }
}


export type MaterialIcon = {
  materialIcon: string
}

export type FallbackIcon = {
  set: string
  icon: string
}

export type Icon = MaterialIcon|FallbackIcon

export type Action = {
  action: () => void|Promise<void> 
} & Icon
