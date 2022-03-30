import { getUuid } from "src/util/fn";

export type TNgAnnotationLine = {
  type: 'line'
  pointA: [number, number, number]
  pointB: [number, number, number]
  id: string
  description?: string
}

export type TNgAnnotationPoint = {
  type: 'point'
  point: [number, number, number]
  id: string
  description?: string
}

export type AnnotationSpec = TNgAnnotationLine | TNgAnnotationPoint
type _AnnotationSpec = Omit<AnnotationSpec, 'type'> & { type: number }
type AnnotationRef = {}

interface NgAnnotationLayer {
  layer: {
    localAnnotations: {
      references: {
        get(id: string): AnnotationRef
        delete(id: string): void
      }
      update(ref: AnnotationRef, spec: _AnnotationSpec): void
      add(spec: _AnnotationSpec): void
      delete(spec: AnnotationRef):void
      annotationMap: Map<string, _AnnotationSpec>
    }
    registerDisposer(fn: () => void): void
  }
  setVisible(flag: boolean): void
}

export class AnnotationLayer {
  private nglayer: NgAnnotationLayer
  constructor(
    private name: string = getUuid(),
    private color="#ffffff"
  ){
    const layerSpec = this.viewer.layerSpecification.getLayer(
      this.name,
      {
        type: "annotation",
        "annotationColor": this.color,
        "annotations": [],
        name: this.name,
        transform: [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ]
      }
    )
    this.nglayer = this.viewer.layerManager.addManagedLayer(layerSpec)
    this.nglayer.layer.registerDisposer(() => {
      this.nglayer = null
    })
  }
  setVisible(flag: boolean){
    this.nglayer.setVisible(flag)
  }
  dispose() {
    try {
      this.viewer.layerManager.removeManagedLayer(this.nglayer)
    } catch (e) {

    }
  }

  addAnnotation(spec: AnnotationSpec){
    const localAnnotations = this.nglayer.layer.localAnnotations
    const annSpec = this.parseNgSpecType(spec)
    localAnnotations.add(
      annSpec
    )
  }
  removeAnnotation(spec: { id: string }) {
    const { localAnnotations } = this.nglayer.layer
    const ref = localAnnotations.references.get(spec.id)
    if (ref) {
      localAnnotations.delete(ref)
      localAnnotations.references.delete(spec.id)
    }
  }
  updateAnnotation(spec: AnnotationSpec) {
    const localAnnotations = this.nglayer.layer.localAnnotations
    const ref = localAnnotations.references.get(spec.id)
    const _spec = this.parseNgSpecType(spec)
    if (ref) {
      localAnnotations.update(
        ref,
        _spec
      )
    } else {
      localAnnotations.add(_spec)
    }
  }

  private get viewer() {
    if ((window as any).viewer) return (window as any).viewer
    throw new Error(`window.viewer not defined`)
  }

  private parseNgSpecType(spec: AnnotationSpec): _AnnotationSpec{
    let overwritingType = null
    if (spec.type === 'point') overwritingType = 0
    if (spec.type === 'line') overwritingType = 1
    if (overwritingType === null) throw new Error(`overwrite type lookup failed for ${spec.type}`)
    return {
      ...spec,
      type: overwritingType
    }
  }
}
