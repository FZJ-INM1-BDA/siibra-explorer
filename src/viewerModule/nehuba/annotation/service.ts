import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Subscription } from "rxjs";
import { filter, map, pairwise, startWith } from "rxjs/operators";
import { AnnotationLayer, TNgAnnotationAABBox, TNgAnnotationLine, TNgAnnotationPoint } from "src/atlasComponents/annotations";
import { annotation } from "src/state";

const ANNOTATION_LAYER_NAME = 'whale-annotation-layer'

@Injectable({
  providedIn: 'root'
})

export class NgAnnotationService implements OnDestroy {

  private subs: Subscription[]  = []
  static INIT_LAYERS: Set<string> = new Set<string>()
  static COLOR_MAP = new Map<keyof typeof annotation.AnnotationColor, string>([
    [annotation.AnnotationColor.WHITE, "#ffffff"],
    [annotation.AnnotationColor.BLUE, "#00ff00"],
    [annotation.AnnotationColor.RED, "#ff0000"],
  ])

  static GET_ANN_LAYER(ann: annotation.UnionAnnotation): AnnotationLayer {
    const color = ann.color || annotation.AnnotationColor.WHITE
    const layerEnum = annotation.AnnotationColor[color] || annotation.AnnotationColor.WHITE
    const layerName = `${ANNOTATION_LAYER_NAME}-${layerEnum}`

    const annLayer = AnnotationLayer.Get(layerName, NgAnnotationService.COLOR_MAP.get(color) || "#ffffff")
    NgAnnotationService.INIT_LAYERS.add(layerName)
    return annLayer
  }

  ngOnDestroy(): void {
    NgAnnotationService.INIT_LAYERS.forEach(layername => {
      const layer = AnnotationLayer.Get(layername, '#ffffff')
      layer.dispose()
    })
    NgAnnotationService.INIT_LAYERS.clear()
    while(this.subs.length) this.subs.pop().unsubscribe()
  }

  constructor(
    private store: Store
  ){
    
    this.subs.push(
      this.store.pipe(
        select(annotation.selectors.spaceFilteredAnnotations)
      ).pipe(
        startWith<annotation.UnionAnnotation[]>([]),
        pairwise(),
        map(([prevAnnotations, currAnnotations]) => {
          const prevAnnotationIds = new Set(prevAnnotations.map(ann => ann["@id"]))
          const currAnnotationIds = new Set(currAnnotations.map(ann => ann["@id"]))
          const newAnnotations = currAnnotations.filter(ann => !prevAnnotationIds.has(ann["@id"]))
          const expiredAnnotations = prevAnnotations.filter(ann => !currAnnotationIds.has(ann["@id"]))
          return {
            newAnnotations,
            expiredAnnotations
          }
        }),
        filter(({ newAnnotations, expiredAnnotations }) => newAnnotations.length > 0 || expiredAnnotations.length > 0)
      ).subscribe(({ newAnnotations, expiredAnnotations }) => {
        
        for (const ann of expiredAnnotations) {
          const annLayer = NgAnnotationService.GET_ANN_LAYER(ann)
          annLayer.removeAnnotation({
            id: ann["@id"]
          })
        }
        for (const ann of newAnnotations) {
          let annotation: TNgAnnotationPoint | TNgAnnotationLine | TNgAnnotationAABBox
          let annLayer: AnnotationLayer
          if (!!ann['openminds']) {
            annLayer = NgAnnotationService.GET_ANN_LAYER(ann)
            annotation = {
              id: ann["@id"],
              description: ann.description,
              type: 'point',
              point: (ann as annotation.Annotation<'openminds'>).openminds.coordinates.map(coord => coord.value * 1e6) as [number, number, number]
            } as TNgAnnotationPoint
          }

          if (annotation && annLayer) annLayer.addAnnotation(annotation)
          else console.warn(`annotation or annotation layer was not initialized.`)
        }
      })
    )
  }
}
