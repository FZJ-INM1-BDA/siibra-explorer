import { AbsToolClass, getCoord, IAnnotationEvents, IAnnotationGeometry, IAnnotationTools, INgAnnotationTypes, TAnnotationEvent, TBaseAnnotationGeomtrySpec, TCallbackFunction, TNgAnnotationEv, TSandsPoint, TToolType } from "./type";
import { merge, Observable, Subject, Subscription } from "rxjs";
import { OnDestroy } from "@angular/core";
import { filter, switchMapTo, takeUntil } from "rxjs/operators";

export type TPointJsonSpec = {
  x: number
  y: number
  z: number
  '@type': 'siibra-ex/annotatoin/point'
} & TBaseAnnotationGeomtrySpec

export class Point extends IAnnotationGeometry {
  id: string
  x: number
  y: number
  z: number

  static threshold = 1e-6
  static eql(p1: Point, p2: Point) {
    return Math.abs(p1.x - p2.x) < Point.threshold
      && Math.abs(p1.y - p2.y) < Point.threshold
      && Math.abs(p1.z - p2.z) < Point.threshold
  }
  constructor(spec?: TPointJsonSpec){
    super(spec)

    this.x = spec.x || 0
    this.y = spec.y || 0
    this.z = spec.z || 0
  }
  toJSON(): TPointJsonSpec{
    const { id, x, y, z, space, name, desc } = this
    return { id, x, y, z, space, name, desc, '@type': 'siibra-ex/annotatoin/point' }
  }

  getNgAnnotationIds(){
    return [this.id]
  }
  toNgAnnotation(): INgAnnotationTypes['point'][]{
    return [{
      id: this.id,
      point: [this.x, this.y, this.z],
      type: 'point',
    }]
  }
  static fromJSON(json: TPointJsonSpec) {
    return new Point(json)
  }

  toString(){
    return `${(this.x / 1e6).toFixed(2)}mm, ${(this.y / 1e6).toFixed(2)}mm, ${(this.z / 1e6).toFixed(2)}mm`
  }

  toSands(): TSandsPoint{
    const {x, y, z} = this
    return {
      '@id': this.id,
      '@type': 'https://openminds.ebrains.eu/sands/CoordinatePoint',
      coordinateSpace: {
        '@id': this.space["@id"]
      },
      coordinates:[ getCoord(x/1e6), getCoord(y/1e6), getCoord(z/1e6) ]
    }
  }

  public translate(x: number, y: number, z: number): void {
    this.x += x
    this.y += y
    this.z += z
    this.updateSignal$.next(this.toString())
  }
}

export const POINT_ICON_CLASS='fas fa-circle'

export class ToolPoint extends AbsToolClass implements IAnnotationTools, OnDestroy {
  static PREVIEW_ID='tool_point_preview'
  public name = 'Point'
  public toolType: TToolType = 'drawing'
  public iconClass = POINT_ICON_CLASS
  
  public subs: Subscription[] = []
  private managedAnnotations: Point[] = []
  public managedAnnotations$ = new Subject<Point[]>()
  public allNgAnnotations$ = new Subject<INgAnnotationTypes[keyof INgAnnotationTypes][]>()
  private forceRefresh$ = new Subject()

  constructor(
    annotationEv$: Observable<TAnnotationEvent<keyof IAnnotationEvents>>,
    callback: TCallbackFunction
  ){
    super(annotationEv$, callback)
    this.init()
    const toolDeselect$ = this.toolSelected$.pipe(
      filter(flag => !flag)
    )

    const toolSelThenClick$ = this.toolSelected$.pipe(
      filter(flag => !!flag),
      switchMapTo(this.mouseClick$.pipe(
        takeUntil(toolDeselect$)
      ))
    )

    this.subs.push(
      /**
       * listen to click ev, add point when it occurrs
       */
      toolSelThenClick$.subscribe(ev => {
        const {x, y, z} = ev.detail.ngMouseEvent
        const { space } = this
        const pt = new Point({
          x, y, z,
          space,
          '@type': 'siibra-ex/annotatoin/point'
        })
        const { id } = pt
        pt.remove = () => this.removeAnnotation(id)
        this.managedAnnotations.push(pt)
        this.managedAnnotations$.next(this.managedAnnotations)

        /**
         * deselect on selecting a point
         */
        this.callback({ type: 'paintingEnd' })
      }),

      /**
       * translate point
       */
      this.dragHoveredAnnotationsDelta$.subscribe(ev => {
        const { ann, deltaX, deltaY, deltaZ } = ev
        const { pickedAnnotationId, pickedOffset } = ann.detail
        const foundAnn = this.managedAnnotations.find(ann => ann.id === pickedAnnotationId)
        if (foundAnn) {
          foundAnn.translate(deltaX, deltaY, deltaZ)
          this.forceRefresh$.next(null)
        }
      }),
      /**
       * evts which forces redraw of ng annotations
       */
      merge(
        toolSelThenClick$,
        this.forceRefresh$,
      ).subscribe(() => {
        let out: INgAnnotationTypes['point'][] = []
        for (const managedAnn of this.managedAnnotations) {
          if (managedAnn.space['@id'] === this.space['@id']) {
            out = out.concat(...managedAnn.toNgAnnotation())
          }
        }
        this.allNgAnnotations$.next(out)
      })
    )
  }

  /**
   * @description remove managed annotation via id
   * @param id id of annotation
   */
  removeAnnotation(id: string) {
    const idx = this.managedAnnotations.findIndex(ann => id === ann.id)

    this.managedAnnotations.splice(idx, 1)
    this.managedAnnotations$.next(this.managedAnnotations)
  }

  onMouseMoveRenderPreview(pos: [number, number, number]) {
    return [{
      id: `${ToolPoint.PREVIEW_ID}_0`,
      point: pos,
      type: 'point',
      description: ''
    }] as INgAnnotationTypes['point'][]
  }

  ngOnDestroy(){
    while (this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}
