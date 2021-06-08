import { IAnnotationTools, IAnnotationGeometry, TAnnotationEvent, IAnnotationEvents, AbsToolClass, INgAnnotationTypes, TNgAnnotationEv, TToolType } from "./type";
import { Point } from './point'
import { OnDestroy } from "@angular/core";
import { merge, Observable, of, Subject, Subscription } from "rxjs";
import { filter, map, pairwise, switchMapTo, takeUntil, withLatestFrom } from "rxjs/operators";

class Polygon extends IAnnotationGeometry{
  public id: string

  private points: Point[] = []
  private idCounter = 0
  private edges: [number, number][] = []

  public hasPoint(p: Point) {
    return this.points.indexOf(p) >= 0
  }

  public addPoint(p: Point | {x: number, y: number, z: number}, linkTo?: Point): Point {
    if (linkTo && !this.hasPoint(linkTo)) {
      throw new Error(`linkTo point does not exist for polygon!`)
    }
    
    const pointToBeAdded = p instanceof Point
      ? p
      : new Point([p.x, p.y, p.z], `${this.id}_${this.idCounter}`)
    this.idCounter += 1
    
    if (!this.hasPoint(pointToBeAdded)) this.points.push(pointToBeAdded)
    if (linkTo) {
      const newEdge = [
        this.points.indexOf(linkTo),
        this.points.indexOf(pointToBeAdded)
      ] as [number, number]
      this.edges.push(newEdge)
    }
    return pointToBeAdded
  }

  toJSON(){
    const { id, points, edges } = this
    return { id, points, edges }
  }
  toNgAnnotation(): INgAnnotationTypes['line'][]{
    return this.edges.map((indices, edgeIdx) => {
      const pt1 = this.points[indices[0]]
      const pt2 = this.points[indices[1]]
      return {
        id: `${this.id}_${edgeIdx}_0`,
        pointA: [pt1.x, pt1.y, pt1.z],
        pointB: [pt2.x, pt2.y, pt2.z],
        type: 'line',
        description: ''
      }
    })
  }

  parseNgAnnotationObj(pickedAnnotationId: string, pickedOffset: number): { edge: [number, number], edgeIdx: number, point: Point, pointIdx: number } {
    const [ id, edgeIdx, _shouldBeZero ] = pickedAnnotationId.split('_')
    if (id !== this.id) return null

    if (pickedOffset === 0) {
      // focus === edge

      const edgeIdxNumber = Number(edgeIdx)
      return {
        edgeIdx: edgeIdxNumber,
        edge: this.edges[edgeIdxNumber],
        pointIdx: null,
        point: null
      }
    }
    if (pickedOffset > 2) throw new Error(`polygon should not have picked offset > 2, but is ${pickedOffset}`)
    const edgeIdxNumber = Number(edgeIdx)
    const edge = this.edges[edgeIdxNumber]
    const pointIdx = edge[ pickedOffset - 1 ]
    return {
      edgeIdx: edgeIdxNumber,
      edge,
      pointIdx,
      point: this.points[pointIdx]
    }
  }

  static fromJSON(json: any){
    const { id, points, edges } = json
    const p = new Polygon()
    p.points = points.map(Point.fromJSON)
    p.edges = edges
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

export class ToolPolygon extends AbsToolClass implements IAnnotationTools, OnDestroy {
  static PREVIEW_ID='tool_poly_preview'

  public name = 'polygon'
  public iconClass = 'fas fa-draw-polygon'
  public toolType: TToolType = 'drawing'

  private selectedPoly: Polygon
  private lastAddedPoint: Point

  private managedAnnotations: Polygon[] = []
  private subs: Subscription[] = []
  private forceRefreshAnnotations$ = new Subject()
  public allNgAnnotations$ = new Subject<INgAnnotationTypes[keyof INgAnnotationTypes][]>()

  onMouseMoveRenderPreview(pos: [number, number, number]) {
    if (this.lastAddedPoint) {
      const { x, y, z } = this.lastAddedPoint
      return [{
        id: `${ToolPolygon.PREVIEW_ID}_0`,
        pointA: [ x, y, z ],
        pointB: pos,
        type: 'line',
        description: ''
      }] as INgAnnotationTypes['line'][]
    }
    return [{
      id: `${ToolPolygon.PREVIEW_ID}_0`,
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
        this.selectedPoly = null
        this.lastAddedPoint = null
      }),
      /**
       * on tool selected
       * on mouse down
       * until tool deselected
       */
      toolSelThenClick$.pipe(
        withLatestFrom(this.hoverAnnotation$)
      ).subscribe(([mouseev, ann]) => {
        if (!this.selectedPoly) {
          this.selectedPoly = new Polygon()
          this.managedAnnotations.push(this.selectedPoly)
        }

        let existingPoint: Point
        if (ann.detail) {
          const { pickedAnnotationId, pickedOffset } = ann.detail
          const out = this.selectedPoly.parseNgAnnotationObj(pickedAnnotationId, pickedOffset)
          existingPoint = out?.point
        }

        const addedPoint = this.selectedPoly.addPoint(
          existingPoint || mouseev.detail.ngMouseEvent,
          this.lastAddedPoint
        )
        this.lastAddedPoint = addedPoint
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
            const {
              currNgX: prevNgX,
              currNgY: prevNgY,
              currNgZ: prevNgZ
            } = prev
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
        const annotation = this.managedAnnotations.find(poly => poly.parseNgAnnotationObj(pickedAnnotationId, pickedOffset))
        if (!annotation) {
          return null
        }
        const parsedAnnotation = annotation.parseNgAnnotationObj(pickedAnnotationId, pickedOffset)
        
        if (!parsedAnnotation.point) {
          /**
           * if point is undefined, then, must be hovering an edge. translate all points
           */
          annotation.translate(deltaX, deltaY, deltaZ)
        } else {
          /**
           * else, only translate the point
           */
          parsedAnnotation.point.translate(deltaX, deltaY, deltaZ)
        }

        this.forceRefreshAnnotations$.next(null)
      }),
    )
  }

  ngAnnotationIsRelevant(annotation: TNgAnnotationEv): boolean {
    // perhaps use more advanced way to track if annotation is a part of polygon?
    return this.managedAnnotations.some(poly => poly.id.indexOf(annotation.pickedAnnotationId) >= 0)
  }

  ngOnDestroy(){
    if (this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}
