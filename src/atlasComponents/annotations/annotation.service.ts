import { BehaviorSubject, Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { getUuid, retry } from "src/util/fn";
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

interface _NgAnnotationLayer {
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

export const ID_AFFINE = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]

export class AnnotationLayer {
  static Map = new Map<string, AnnotationLayer>()
  static Get(name: string, color: string){
    if (AnnotationLayer.Map.has(name)) return AnnotationLayer.Map.get(name)
    const layer = new AnnotationLayer(name, color)
    AnnotationLayer.Map.set(name, layer)
    return layer
  }

  static LayerReady(){
    return (_target: Record<string, any>, _propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value
      descriptor.value = function(...args: any[]) {
        PeriodicSvc.AddToQueue(() => {
          if (!this.layer) return false
          if (!this.layer.isReady()) return false
          try {
            originalMethod.apply(this, args)
          } catch (e) {
            console.warn(`LayerReady decorated failed`, e)
          }
          return true
        })
      }
    }
  }

  private _onHover = new BehaviorSubject<{ id: string, offset: number }>(null)
  public onHover: Observable<{ id: string, offset: number }> = this._onHover.asObservable().pipe(
    distinctUntilChanged((o, n) => o?.id === n?.id)
  )
  private onDestroyCb: (() => void)[] = []
  
  private idset = new Set<string>()

  #layer: any
  get layer() {
    return this.#layer
  }
  #coupled: boolean = false
  get coupled() {
    return this.#coupled
  }
  #disposed: boolean = false
  get disposed(){
    return this.#disposed
  }

  constructor(
    private name: string = getUuid(),
    private color="#ffffff",
    affine=ID_AFFINE,
  ){
    promiseViewer().then(viewer => {
      this.#coupleToViewer(viewer, affine)
    })
  }
 
  #coupleToViewer(viewer: any, affine: number[][]){
    const layerSpec = viewer.layerSpecification.getLayer(
      this.name,
      {
        type: "annotation",
        "annotationColor": this.color,
        "annotations": [],
        name: this.name,
        transform: affine,
      }
    )
    this.#layer = viewer.layerManager.addManagedLayer(layerSpec)
    const mouseState = viewer.mouseState
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

    // TODO registerdisposer seems to fire without the layer been removed
    // Thus it cannot be relied upon for cleanup
    // 
    // _layer.layer.registerDisposer(() => {

    // })
    NehubaLayerControlService.RegisterLayerName(this.name)
    viewer.registerDisposer(() => {
      this.dispose()
    })
  }

  @AnnotationLayer.LayerReady()
  async setVisible(flag: boolean){
    this.#layer.setVisible(flag)
  }
  dispose() {
    this.#disposed = true
    NehubaLayerControlService.DeregisterLayerName(this.name)
    AnnotationLayer.Map.delete(this.name)
    this._onHover.complete()
    while(this.onDestroyCb.length > 0) {
      this.onDestroyCb.pop()()
    }

    try {
      if (this.#layer){
        this.#layer.manager.layerManager.removeManagedLayer(this.#layer)
      }
    // eslint-disable-next-line no-empty
    } catch (e) {
      // errors if viewer is disposed first, which trigger layer.dispose() called
    }
  }

  /**
   * Unsafe method. Caller should ensure this.nglayer.isReady()
   * 
   * @param spec 
   */
  @AnnotationLayer.LayerReady()
  async _addSingleAnn(spec: AnnotationSpec) {
    const localAnnotations = this.#layer.layer.localAnnotations
    this.idset.add(spec.id)
    const annSpec = this.parseNgSpecType(spec)
    localAnnotations.add(
      annSpec
    )  
  }

  @AnnotationLayer.LayerReady()
  async addAnnotation(spec: AnnotationSpec|AnnotationSpec[]){
    if (Array.isArray(spec)) {
      for (const item of spec) {
        this._addSingleAnn(item)
      }
    } else {
      this._addSingleAnn(spec)
    }
  }

  @AnnotationLayer.LayerReady()
  async removeAnnotation(spec: { id: string }) {
    const { localAnnotations } = this.#layer.layer
    this.idset.delete(spec.id)
    const ref = localAnnotations.references.get(spec.id)
    if (ref) {
      localAnnotations.delete(ref)
      localAnnotations.references.delete(spec.id)
    }
  }

  /**
   * Unsafe method. Caller should ensure this.nglayer.layer is defined
   * 
   * @param spec 
   */
  @AnnotationLayer.LayerReady()
  async _updateSingleAnn(spec: AnnotationSpec) {
    try {
      const { localAnnotations } = this.#layer.layer
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
    } catch (e) {
      console.error(`update single annotation error:`, e)
      return
    }
  }

  @AnnotationLayer.LayerReady()
  async updateAnnotation(spec: AnnotationSpec|AnnotationSpec[]) {
    if (Array.isArray(spec)) {
      for (const item of spec){
        this._updateSingleAnn(item)
      }
      return
    }
    this._updateSingleAnn(spec)
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

export function getViewer(){
  const viewer = (window as any).viewer
  if (viewer) {
    return viewer
  }
  throw new Error(`window.viewer not defined`)
}

export async function promiseViewer(){
  try {
    return getViewer()
  } catch (e) {
    return await retry(() => getViewer(), { timeout: 160, retries: 1e10 })
  } 
}
