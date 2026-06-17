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

// ---------------------------------------------------------------------------
// ColoredAnnotationLayer
// ---------------------------------------------------------------------------
//
// A variant of AnnotationLayer that declares an `rgb` annotation property
// spec at layer-creation time and forwards per-annotation RGB values received
// from TNgAnnotationColoredLine.  All other behaviour is identical to
// AnnotationLayer; the two classes deliberately share no inheritance so that
// AnnotationLayer itself remains untouched.

/** A TNgAnnotationLine carrying an optional per-edge RGB color. */
export type TNgAnnotationColoredLine = TNgAnnotationLine & {
  /** [r, g, b] in [0, 255].  Omit to fall back to the layer default color. */
  rgb?: [number, number, number]
}

export type ColoredAnnotationSpec = TNgAnnotationColoredLine | TNgAnnotationPoint | TNgAnnotationAABBox

export class ColoredAnnotationLayer {

  /**
   * GLSL shader for the annotation layer.  Reads the per-annotation `color`
   * property (rgb) and applies a uniform opacity slider.
   */
  static readonly SHADER = `
#uicontrol float opacity slider(min=0, max=1, default=1)
void main() {
  setColor(vec4(prop_color().rgb, opacity));
  setLineWidth(2.0);
  setPointMarkerSize(8.0);
}
`.trim()

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
            console.warn(`ColoredAnnotationLayer LayerReady decorated failed`, e)
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
  get layer() { return this.#layer }

  #disposed = false
  get disposed() { return this.#disposed }

  constructor(
    private name: string = getUuid(),
    affine = ID_AFFINE,
  ) {
    promiseViewer().then(viewer => this.#coupleToViewer(viewer, affine))
  }

  #coupleToViewer(viewer: any, affine: number[][]) {
    const layerSpec = viewer.layerSpecification.getLayer(
      this.name,
      {
        type: 'annotation',
        name: this.name,
        transform: affine,
        annotationPropertySpecs: [
          { id: 'color', type: 'rgb', default: 0xeeeeee }
        ],
        shader: ColoredAnnotationLayer.SHADER,
        annotations: [],
      }
    )
    this.#layer = viewer.layerManager.addManagedLayer(layerSpec)

    const mouseState = viewer.mouseState
    const unsubscribe: () => void = mouseState.changed.add(() => {
      const payload = mouseState.active
        && !!mouseState.pickedAnnotationId
        && this.idset.has(mouseState.pickedAnnotationId)
          ? { id: mouseState.pickedAnnotationId, offset: mouseState.pickedOffset }
          : null
      this._onHover.next(payload)
    })
    this.onDestroyCb.push(unsubscribe)

    NehubaLayerControlService.RegisterLayerName(this.name)
    viewer.registerDisposer(() => this.dispose())
  }

  @ColoredAnnotationLayer.LayerReady()
  async setVisible(flag: boolean) {
    this.#layer.setVisible(flag)
  }

  dispose() {
    this.#disposed = true
    NehubaLayerControlService.DeregisterLayerName(this.name)
    this._onHover.complete()
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
    try {
      if (this.#layer) {
        this.#layer.manager.layerManager.removeManagedLayer(this.#layer)
      }
    } catch (_e) {
      // viewer may already be disposed
    }
  }

  @ColoredAnnotationLayer.LayerReady()
  async updateAnnotation(spec: ColoredAnnotationSpec | ColoredAnnotationSpec[]) {
    const specs = Array.isArray(spec) ? spec : [spec]
    for (const s of specs) {
      this._updateSingle(s)
    }
  }

  @ColoredAnnotationLayer.LayerReady()
  async removeAnnotation(spec: { id: string }) {
    const { localAnnotations } = this.#layer.layer
    this.idset.delete(spec.id)
    const ref = localAnnotations.references.get(spec.id)
    if (ref) {
      localAnnotations.delete(ref)
      localAnnotations.references.delete(spec.id)
    }
  }

  @ColoredAnnotationLayer.LayerReady()
  private _updateSingle(spec: ColoredAnnotationSpec) {
    try {
      const { localAnnotations } = this.#layer.layer
      const parsed = this._parseSpec(spec)
      const ref = localAnnotations.references.get(spec.id)
      if (ref) {
        localAnnotations.update(ref, parsed)
      } else {
        this.idset.add(spec.id)
        localAnnotations.add(parsed)
      }
    } catch (e) {
      console.error('ColoredAnnotationLayer._updateSingle error:', e)
    }
  }

  private _parseSpec(spec: ColoredAnnotationSpec): Record<string, unknown> {
    let typeNum: number
    switch (spec.type) {
      case 'point':   typeNum = 0; break
      case 'line':    typeNum = 1; break
      case 'aabbox':  typeNum = 2; break
      default: throw new Error(`ColoredAnnotationLayer: unknown type ${(spec as any).type}`)
    }

    // Pack rgb into a single uint32 matching neuroglancer's 'rgb' property encoding.
    const rgb = (spec as TNgAnnotationColoredLine).rgb ?? [238, 238, 238]
    const packedColor = ((rgb[0] & 0xff) << 16) | ((rgb[1] & 0xff) << 8) | (rgb[2] & 0xff)

    return {
      ...spec,
      type:       typeNum,
      properties: [packedColor],  // must match annotationPropertySpecs order
    }
  }
}
