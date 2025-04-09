import { BehaviorSubject, from, Observable, of } from "rxjs";
import { distinctUntilChanged, map, switchMap, take } from "rxjs/operators";
import { getUuid, retry, switchMapWaitFor } from "src/util/fn";
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

  private _onHover = new BehaviorSubject<{ id: string, offset: number }>(null)
  public onHover: Observable<{ id: string, offset: number }> = this._onHover.asObservable().pipe(
    distinctUntilChanged((o, n) => o?.id === n?.id)
  )
  private onDestroyCb: (() => void)[] = []
  
  private idset = new Set<string>()
  constructor(
    private name: string = getUuid(),
    private color="#ffffff",
    affine=ID_AFFINE,
  ){
    this.#getViewerObs().pipe(
      take(1)
    ).subscribe(viewer => {
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
    const _layer = viewer.layerManager.addManagedLayer(layerSpec)
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
  }
  async setVisible(flag: boolean){
    const nglayer = await this.#getLayer()
    nglayer && nglayer.setVisible(flag)
  }
  dispose() {
    NehubaLayerControlService.DeregisterLayerName(this.name)
    AnnotationLayer.Map.delete(this.name)
    this._onHover.complete()
    while(this.onDestroyCb.length > 0) {
      this.onDestroyCb.pop()()
    }

    try {
      const viewer = this.#getViewer()
      const l = viewer.layerManager.getLayerByName(this.name)
      viewer.layerManager.removeManagedLayer(l)
    // eslint-disable-next-line no-empty
    } catch (e) {
      console.error("removing layer failed", e)
    }
  }

  /**
   * Unsafe method. Caller should ensure this.nglayer.isReady()
   * 
   * @param spec 
   */
  async #addSingleAnn(spec: AnnotationSpec) {
    const nglayer = await this.#getLayer()
    const localAnnotations = nglayer.layer.localAnnotations
    this.idset.add(spec.id)
    const annSpec = this.parseNgSpecType(spec)
    localAnnotations.add(
      annSpec
    )  
  }

  async clear(){
    const nglayer = await this.#getLayerObs().pipe(
      switchMap(switchMapWaitFor({
        condition: nglayer => !!nglayer?.layer?.localAnnotations,
        leading: true
      })),
      take(1)
    ).toPromise()
    // await waitFor(() => !!nglayer?.layer?.localAnnotations)
    const { localAnnotations } = nglayer.layer
    localAnnotations.clear()
  }

  async addAnnotation(spec: AnnotationSpec|AnnotationSpec[]){
    const nglayer = await this.#getLayer()
    if (!nglayer) {
      throw new Error(`layer has already been disposed`)
    }

    PeriodicSvc.AddToQueue(() => {
      if (nglayer.isReady()) {
        if (Array.isArray(spec)) {
          for (const item of spec) {
            this.#addSingleAnn(item)
          }
        } else {
          this.#addSingleAnn(spec)
        }
        
        return true
      }
      return false
    })
  }
  async removeAnnotation(spec: { id: string }|{id: string}[]) {
    const nglayer = await this.#getLayerObs().pipe(
      switchMap(switchMapWaitFor({
        condition: nglayer => !!nglayer?.layer?.localAnnotations,
        leading: true
      })),
      take(1)
    ).toPromise()
    // await waitFor(() => !!nglayer?.layer?.localAnnotations)
    const { localAnnotations } = nglayer.layer
    const specs = Array.isArray(spec) ? spec : [spec]
    for (const spec of specs){
      this.idset.delete(spec.id)
      const ref = localAnnotations.references.get(spec.id)
      if (ref) {
        localAnnotations.delete(ref)
        localAnnotations.references.delete(spec.id)
      }
    }
  }

  /**
   * Unsafe method. Caller should ensure this.nglayer.layer is defined
   * 
   * @param spec 
   */
  async #updateSingleAnn(spec: AnnotationSpec) {
    try {

      const nglayer = this.#unsafeGetLayer()
      
      const { localAnnotations } = nglayer.layer
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

  async updateAnnotation(spec: AnnotationSpec|AnnotationSpec[]) {
    
    const _nglayer = await this.#getLayerObs().pipe(
      switchMap(switchMapWaitFor({
        condition: nglayer => !!nglayer?.layer?.localAnnotations,
        leading: true
      })),
      take(1)
    ).toPromise()
    // await waitFor(() => !!this.nglayer?.layer?.localAnnotations)
    if (Array.isArray(spec)) {
      for (const item of spec){
        this.#updateSingleAnn(item)
      }
      return
    }
    this.#updateSingleAnn(spec)
  }

  #getViewer(){
    
    if ((window as any).viewer) return (window as any).viewer
    throw new Error(`window.viewer not defined`)
  }

  #getViewerObs(): Observable<any>{

    const tryAgain = () => retry(() => this.#getViewer(), { timeout: 160, retries: 100 })
    
    try {
      const viewer = this.#getViewer()
      return of(viewer)
    } catch {
      return from(tryAgain()) 
    }
  }

  #getLayerObs(): Observable<any> {
    return this.#getViewerObs().pipe(
      map(viewer => viewer.layerManager.getLayerByName(this.name))
    )
  }

  #getLayer(): Promise<any> {
    return this.#getLayerObs().pipe(
      take(1)
    ).toPromise()
  }

  #unsafeGetLayer() {
    const viewer = this.#getViewer()
    return viewer.layerManager.getLayerByName(this.name)
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
