import { getUuid } from "./fn"

type TSandsQValue = {
  '@id': string
  '@type': 'https://openminds.ebrains.eu/core/QuantitativeValue'
  uncertainty?: [number, number]
  value: number
  unit: {
    '@id': 'id.link/mm'
  }
}

export type TSandsCoord = TSandsQValue[]

export type TSandsPoint = {
  coordinates: TSandsCoord
  coordinateSpace: {
    '@id': string
  }
  '@type': 'https://openminds.ebrains.eu/sands/CoordinatePoint'
  '@id': string
}

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
    '@type': "https://openminds.ebrains.eu/core/QuantitativeValue",
    value,
    unit: {
      "@id": 'id.link/mm'
    }
  }
}
