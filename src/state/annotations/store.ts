import { createReducer } from "@ngrx/store"

export type Annotation = {
  "@id": string
}

export type AnnotationState = {
  annotations: Annotation[]
}

const defaultState: AnnotationState = {
  annotations: []
}

const reducer = createReducer(
  defaultState
)

export {
  reducer
}
