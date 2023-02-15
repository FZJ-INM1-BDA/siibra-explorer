import { createReducer, on } from "@ngrx/store"
import { OpenMINDSCoordinatePoint } from "src/atlasComponents/sapi/type_v3"
import * as actions from "./actions"

type Line = {
  pointA: OpenMINDSCoordinatePoint
  pointB: OpenMINDSCoordinatePoint
}

type BBox = {
  pointA: OpenMINDSCoordinatePoint
  pointB: OpenMINDSCoordinatePoint
}

export type TypesOfDetailedAnnotations = {
  openminds: OpenMINDSCoordinatePoint
  line: Line
  box: BBox
}

export enum AnnotationColor {
  WHITE="WHITE",
  RED="RED",
  BLUE="BLUE",
}

export type Annotation<T extends keyof TypesOfDetailedAnnotations> = {
  "@id": string
  name: string
  description?: string
  color?: AnnotationColor
} & { [key in T] : TypesOfDetailedAnnotations[T]}

export type UnionAnnotation = Annotation<'openminds'> | Annotation<'line'> | Annotation<'box'>

export type AnnotationState = {
  annotations: UnionAnnotation[]
}

export const defaultState: AnnotationState = {
  annotations: []
}

const reducer = createReducer(
  defaultState,
  on(
    actions.addAnnotations,
    (state, { annotations }) => {
      return {
        ...state,
        annotations: [
          ...state.annotations,
          ...annotations,
        ]
      }
    }
  ),
  on(
    actions.rmAnnotations,
    (state, { annotations }) => {
      const annIdToBeRemoved = annotations.map(ann => ann["@id"])
      return {
        ...state,
        annotations: state.annotations.filter(ann => !annIdToBeRemoved.includes(ann["@id"]) )
      }
    }
  )
)

export {
  reducer
}
