import { AbsToolClass, getCoord, IAnnotationEvents, IAnnotationGeometry, IAnnotationTools, INgAnnotationTypes, TAnnotationEvent, TBaseAnnotationGeomtrySpec, TCallbackFunction, TSandsPoint, TToolType } from "./type";
import { Observable, Subject, Subscription } from "rxjs";
import { Directive, OnDestroy } from "@angular/core";
import { filter, switchMapTo, takeUntil } from "rxjs/operators";

export type TPointJsonSpec = {
  x: number
  y: number
  z: number
  '@type': 'siibra-ex/annotation/point'
} & TBaseAnnotationGeomtrySpec

export class Point extends IAnnotationGeometry {
  id: string
  x: number
  y: number
  z: number

  public annotationType = 'Point'
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
    return { id, x, y, z, space, name, desc, '@type': 'siibra-ex/annotation/point' }
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

  static fromSANDS(sands: TSandsPoint): Point {
    const {
      "@id": id,
      "@type": type,
      coordinateSpace,
      coordinates
    } = sands
    const { ['@id']: spaceId } = coordinateSpace
    if (type === 'https://openminds.ebrains.eu/sands/CoordinatePoint') {
      const parsedCoordinate = coordinates.map(coord => {
        const { value, unit } = coord
        if (unit["@id"] !== 'id.link/mm') throw new Error(`Unit does not parse`)
        return value * 1e6
      })
      const point = new Point({
        id,
        space: { id: spaceId },
        "@type": 'siibra-ex/annotation/point',
        x: parsedCoordinate[0],
        y: parsedCoordinate[1],
        z: parsedCoordinate[2],
      })
      return point
    }

    throw new Error(`cannot parse sands for points, @type mismatch`)
  }

  toString(){
    return `${(this.x / 1e6).toFixed(2)}mm, ${(this.y / 1e6).toFixed(2)}mm, ${(this.z / 1e6).toFixed(2)}mm`
  }

  toSands(): TSandsPoint{
    const { id } = this.space
    const {x, y, z} = this
    return {
      '@id': this.id,
      '@type': 'https://openminds.ebrains.eu/sands/CoordinatePoint',
      coordinateSpace: {
        '@id': id
      },
      coordinates:[ getCoord(x/1e6), getCoord(y/1e6), getCoord(z/1e6) ]
    }
  }

  public translate(x: number, y: number, z: number): void {
    this.x += x
    this.y += y
    this.z += z
    this.changed()
  }
}

export const POINT_ICON_CLASS='fas fa-circle'

@Directive()
export class ToolPoint extends AbsToolClass<Point> implements IAnnotationTools, OnDestroy {
  static PREVIEW_ID='tool_point_preview'
  public name = 'Point'
  public toolType: TToolType = 'drawing'
  public iconClass = POINT_ICON_CLASS
  
  public subs: Subscription[] = []
  protected managedAnnotations: Point[] = []
  public managedAnnotations$ = new Subject<Point[]>()

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
          '@type': 'siibra-ex/annotation/point'
        })
        this.addAnnotation(pt)

        if (this.callback) {

          /**
           * message
           */
          this.callback({
            type: 'message',
            message: `Point added`,
            action: 'Open',
            actionCallback: () => this.callback({ type: 'showList' })
          })
          
          /**
            * deselect on selecting a point
            */
          this.callback({ type: 'paintingEnd' })
        }
      }),

      /**
       * translate point
       */
      this.dragHoveredAnnotationsDelta$.subscribe(ev => {
        const { ann, deltaX, deltaY, deltaZ } = ev
        const { pickedAnnotationId } = ann.detail
        const foundAnn = this.managedAnnotations.find(ann => ann.id === pickedAnnotationId)
        if (foundAnn) {
          foundAnn.translate(deltaX, deltaY, deltaZ)
          this.managedAnnotations$.next(this.managedAnnotations)
        }
      }),
    )
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
