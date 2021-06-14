import {
  IAnnotationTools,
  IAnnotationGeometry,
  TAnnotationEvent,
  IAnnotationEvents,
  AbsToolClass,
  INgAnnotationTypes,
  TNgAnnotationEv,
  TToolType,
} from "./type";
import { Point } from './point'
import {OnDestroy} from "@angular/core";
import { merge, Observable, of, Subject, Subscription } from "rxjs";
import { filter, map, pairwise, switchMapTo, takeUntil, withLatestFrom } from "rxjs/operators";

class Line extends IAnnotationGeometry{
  public id: string

  public points: [Point, Point] = [null, null]

  public hasPoint(p: Point) {
    return this.points.indexOf(p) >= 0
  }

  public addLinePoints(p: Point | {x: number, y: number, z: number}): Point {
    const point = p instanceof Point ? p : new Point([p.x, p.y, p.z], this.id)
    this.points[0] = point
    if (!this.points[1]) this.points[1] = point
    return point
  }


  toJSON(){
    const { id, points } = this
    return { id, points }
  }

  toNgAnnotation(): INgAnnotationTypes['line'][] {
    const pt1 = this.points[0]
    const pt2 = this.points[1]
    return [{
      id: `${this.id}`,
      pointA: [pt1.x, pt1.y, pt1.z],
      pointB: [pt2.x, pt2.y, pt2.z],
      type: 'line',
      description: ''
    }]

  }

  static fromJSON(json: any){
    const { id, points } = json
    const p = new Line()
    p.points = points.map(Point.fromJSON)
    p.id = id
    return p
  }

  constructor(){
    super()
  }

  public translate(x: number, y: number, z: number) {
    for (const p of this.points){
      p.translate(x, y, z)
    }
  }
}

export class ToolLine extends AbsToolClass implements IAnnotationTools, OnDestroy {
  static PREVIEW_ID='tool_line_preview'
  public name = 'Line'
  public toolType: TToolType = 'drawing'
  public iconClass = 'fas fa-slash'

  private selectedLine: Line
  private firstPoint: Point
  private secondPoint: Point

  private subs: Subscription[] = []
  private forceRefreshAnnotations$ = new Subject()
  private managedAnnotations: Line[] = []
  public allNgAnnotations$ = new Subject<INgAnnotationTypes[keyof INgAnnotationTypes][]>()


  onMouseMoveRenderPreview(pos: [number, number, number]) {
    if (this.firstPoint) {
      const { x, y, z } = this.firstPoint
      return [{
        id: `${ToolLine.PREVIEW_ID}_0`,
        pointA: [ x, y, z ],
        pointB: pos,
        type: 'line',
        description: ''
      }] as INgAnnotationTypes['line'][]
    }
    return [{
      id: `${ToolLine.PREVIEW_ID}_0`,
      point: pos,
      type: 'point',
      description: ''
    }] as INgAnnotationTypes['point'][]
  }


  constructor(
    annotationEv$: Observable<TAnnotationEvent<keyof IAnnotationEvents>>
  ){
    super(annotationEv$)

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
       * on end tool select
       */
      toolDeselect$.subscribe(() => {
        this.selectedLine = null
        this.firstPoint = null
      }),
      /**
       * on tool selected
       * on mouse down
       * until tool deselected
       */
      toolSelThenClick$.pipe(
        withLatestFrom(this.hoverAnnotation$)
      ).subscribe(([mouseev, ann]) => {
        if (!this.selectedLine) {
          this.selectedLine = new Line()
          this.managedAnnotations.push(this.selectedLine)
        }


        const crd = mouseev.detail.ngMouseEvent

        if (!this.firstPoint) {
          this.selectedLine.addLinePoints(crd)
          this.firstPoint = new Point([crd.x, crd.y, crd.z], this.selectedLine.id)
        } else {
          // ToDo Tool Should Be Deselected.

        }
      }),

      /**
       * conditions by which ng annotations are refreshed
       */
      merge(
        toolDeselect$,
        toolSelThenClick$,
        this.forceRefreshAnnotations$,
      ).pipe(

      ).subscribe(() => {
        let out: INgAnnotationTypes['line'][] = []
        for (const managedAnn of this.managedAnnotations) {
          out = out.concat(...managedAnn.toNgAnnotation())
        }
        this.allNgAnnotations$.next(out)
      }),

      /**
       * emit on init, and reset on mouseup$
       * otherwise, pairwise confuses last drag event and first drag event
       */
      merge(
        of(null),
        this.mouseUp$
      ).pipe(
        switchMapTo(this.dragHoveredAnnotation$.pipe(
          pairwise(),
          map(([ prev, curr ]) => {
            const { currNgX, currNgY, currNgZ } = curr
            const {currNgX: prevNgX, currNgY: prevNgY, currNgZ: prevNgZ} = prev
            return {
              ann: curr.ann,
              deltaX: currNgX - prevNgX,
              deltaY: currNgY - prevNgY,
              deltaZ: currNgZ - prevNgZ,
            }
          }),
        ))
      ).subscribe(val => {
        const { ann, deltaX, deltaY, deltaZ } = val
        const { pickedAnnotationId, pickedOffset } = ann.detail


        const annotation = this.managedAnnotations.find(an => an.id === pickedAnnotationId)
        if (!annotation) {
          return null
        }

        // ToDo does not work
        if (pickedOffset === 2) {
          annotation.points[1].translate(deltaX, deltaY, deltaZ)
        } else if (pickedOffset === 1) {
          annotation.points[0].translate(deltaX, deltaY, deltaZ)
        } else {
          annotation.translate(deltaX, deltaY, deltaZ)
        }

      })
    )
  }

  ngAnnotationIsRelevant(annotation: TNgAnnotationEv){
    return this.managedAnnotations.some(p => p.id === annotation.pickedAnnotationId)
  }

  ngOnDestroy(){
    this.subs.forEach(s => s.unsubscribe())
  }

}
