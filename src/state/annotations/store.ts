import { createReducer, on } from "@ngrx/store"
import * as actions from "./actions"

export type Annotation = {
  "@id": string
}

export type AnnotationState = {
  annotations: Annotation[]
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
