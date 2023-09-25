import { BehaviorSubject, Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { getUuid, waitFor } from "src/util/fn";
import { PeriodicSvc } from "src/util/periodic.service";
import { NehubaLayerControlService } from "src/viewerModule/nehuba/layerCtrl.service";

export type TNgAnnotationEv = {
  pickedAnnotationId: string
  pickedOffset: number
}

/**
 * axis aligned bounding box
 */
export type TNgAnnotationAABBox = {
  type: 'aabbox'
  pointA: [number, number, number]
  pointB: [number, number, number]
  id: string
  description?: string
}

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

export type AnnotationSpec = TNgAnnotationLine | TNgAnnotationPoint | TNgAnnotationAABBox
type _AnnotationSpec = Omit<AnnotationSpec, 'type'> & { type: number }
type AnnotationRef = Record<string, unknown>

interface NgAnnotationLayer {
  isReady: () => boolean
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
  layerChanged: {
    add(cb: () => void): void
  }
  visible: boolean
}

export class AnnotationLayer {
  static Map = new Map<string, AnnotationLayer>()
  static Get(name: string, color: string){
    if (AnnotationLayer.Map.has(name)) return AnnotationLayer.Map.get(name)
    const layer = new AnnotationLayer(name, color)
    AnnotationLayer.Map.set(name, layer)
    return layer
  }

  private _onHover = new BehaviorSubject<{ id: string, offset: number }>(null)
  public onHover: Observable<{ id: string, offset: number }> = this._onHover.asObservable().pipe(
    distinctUntilChanged((o, n) => o?.id === n?.id)
  )
  private onDestroyCb: (() => void)[] = []
  private nglayer: NgAnnotationLayer
  private idset = new Set<string>()
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
    const mouseState = this.viewer.mouseState
    const res: () => void = mouseState.changed.add(() => {
      const payload = mouseState.active
      && !!mouseState.pickedAnnotationId
      && this.idset.has(mouseState.pickedAnnotationId)
        ? {
          id: mouseState.pickedAnnotationId,
          offset: mouseState.pickedOffset
        }
        : null
      this._onHover.next(payload)
    })
    this.onDestroyCb.push(res)

    this.nglayer.layer.registerDisposer(() => {
      // TODO registerdisposer seems to fire without the layer been removed
      // Thus it cannot be relied upon for cleanup
    })
    NehubaLayerControlService.RegisterLayerName(this.name)
  }
  setVisible(flag: boolean){
    this.nglayer && this.nglayer.setVisible(flag)
  }
  dispose() {
    NehubaLayerControlService.DeregisterLayerName(this.name)
    AnnotationLayer.Map.delete(this.name)
    this._onHover.complete()
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
    try {
      this.viewer.layerManager.removeManagedLayer(this.nglayer)
      this.nglayer = null
    // eslint-disable-next-line no-empty
    } catch (e) {

    }
  }

  async addAnnotation(spec: AnnotationSpec){
    if (!this.nglayer) {
      throw new Error(`layer has already been disposed`)
    }

    PeriodicSvc.AddToQueue(() => {
      if (this.nglayer.isReady()) {
        const localAnnotations = this.nglayer.layer.localAnnotations
        this.idset.add(spec.id)
        const annSpec = this.parseNgSpecType(spec)
        localAnnotations.add(
          annSpec
        )  
        return true
      }
      return false
    })
  }
  async removeAnnotation(spec: { id: string }) {
    await waitFor(() => !!this.nglayer?.layer?.localAnnotations)
    const { localAnnotations } = this.nglayer.layer
    this.idset.delete(spec.id)
    const ref = localAnnotations.references.get(spec.id)
    if (ref) {
      localAnnotations.delete(ref)
      localAnnotations.references.delete(spec.id)
    }
  }
  async updateAnnotation(spec: AnnotationSpec) {
    await waitFor(() => !!this.nglayer?.layer?.localAnnotations)
    const { localAnnotations } = this.nglayer.layer
    const ref = localAnnotations.references.get(spec.id)
    const _spec = this.parseNgSpecType(spec)
    if (ref) {
      localAnnotations.update(
        ref,
        _spec
      )
    } else {
      this.idset.add(_spec.id)
      localAnnotations.add(_spec)
    }
  }

  private get viewer() {
    if ((window as any).viewer) return (window as any).viewer
    throw new Error(`window.viewer not defined`)
  }

  private parseNgSpecType(spec: AnnotationSpec): _AnnotationSpec{
    const overwrite: Partial<_AnnotationSpec> = {}
    switch (spec.type) {
    case "point": {
      overwrite['type'] = 0
      break
    }
    case "line": {
      overwrite['type'] = 1
      break
    }
    case "aabbox": {
      overwrite['type'] = 2
      break
    }
    default: throw new Error(`overwrite type lookup failed for ${(spec as any).type}`)
    }

    return {
      ...spec,
      ...overwrite,
    } as _AnnotationSpec
  }
}
