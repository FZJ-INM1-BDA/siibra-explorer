import { createSelector } from "@ngrx/store"
import { nameSpace } from "./const"
import { Annotation, AnnotationState } from "./store"
import { selectors as atlasSelectionSelectors } from "../atlasSelection"

const selectStore = state => state[nameSpace] as AnnotationState

export const annotations = createSelector(
  selectStore,
  state => state.annotations
)

export const spaceFilteredAnnotations = createSelector(
  selectStore,
  atlasSelectionSelectors.selectStore,
  (annState, atlasSelState) => annState.annotations.filter(ann => {
    const spaceId = atlasSelState.selectedTemplate['@id']
    if (ann['openminds']) {
      return (ann as Annotation<'openminds'>).openminds.coordinateSpace['@id'] === spaceId
    }

    if (ann['line']) {
      return (ann as Annotation<'line'>).line.pointA.coordinateSpace['@id'] === spaceId
        && (ann as Annotation<'line'>).line.pointB.coordinateSpace['@id'] === spaceId
    }

    if (ann['box']) {
      return (ann as Annotation<'box'>).box.pointA.coordinateSpace['@id'] === spaceId
        &&  (ann as Annotation<'box'>).box.pointB.coordinateSpace['@id'] === spaceId
    }
  })
)
