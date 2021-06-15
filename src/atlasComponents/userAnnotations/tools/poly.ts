import { IAnnotationTools, IAnnotationGeometry, TAnnotationEvent, IAnnotationEvents, AbsToolClass, INgAnnotationTypes, TNgAnnotationEv, TToolType, TBaseAnnotationGeomtrySpec, TSandsPolyLine, getCoord } from "./type";
import { Point, TPointJsonSpec } from './point'
import { OnDestroy } from "@angular/core";
import { merge, Observable, Subject, Subscription } from "rxjs";
import { filter, switchMapTo, takeUntil, withLatestFrom } from "rxjs/operators";
import { getUuid } from "src/util/fn";

type TPolyJsonSpec = {
  points: TPointJsonSpec[]
  edges: [number, number][]
  '@type': 'siibra-ex/annotation/polyline'
} & TBaseAnnotationGeomtrySpec

export class Polygon extends IAnnotationGeometry{
  public id: string

  public points: Point[] = []
  public edges: [number, number][] = []

  public hasPoint(p: Point): boolean {
    return this.points.indexOf(p) >= 0
  }

  private ptWkMp = new WeakMap<Point, {
    onremove: Function
  }>()

  public removePoint(p: Point) {
    if (!this.hasPoint(p)) throw new Error(`polygon does not have this point`)
    const returnObj = this.ptWkMp.get(p)
    if (returnObj && returnObj.onremove) returnObj.onremove()

    /**
     * remove all edges associated with this point
     */
    const ptIdx = this.points.indexOf(p)
    this.edges = this.edges.filter(([ idx1, idx2 ]) => idx1 !== ptIdx && idx2 !== ptIdx)
    this.points.splice(ptIdx, 1)

    this.sendUpdateSignal()
  }

  public addPoint(p: Point | {x: number, y: number, z: number}, linkTo?: Point): Point {
    if (linkTo && !this.hasPoint(linkTo)) {
      throw new Error(`linkTo point does not exist for polygon!`)
    }
    const pointToBeAdded = p instanceof Point
      ? p
      : new Point({
          id: `${this.id}_${getUuid()}`,
          space: this.space,
          '@type': 'siibra-ex/annotatoin/point',
          ...p
        })
    
    if (!this.hasPoint(pointToBeAdded)) {
      this.points.push(pointToBeAdded)
      const sub = pointToBeAdded.updateSignal$.subscribe(
        () => this.sendUpdateSignal()
      )
      this.ptWkMp.set(pointToBeAdded, {
        onremove: () => {
          sub.unsubscribe()
        }
      })
    }
    if (linkTo) {
      const newEdge = [
        this.points.indexOf(linkTo),
        this.points.indexOf(pointToBeAdded)
      ] as [number, number]
      this.edges.push(newEdge)
    }
    this.sendUpdateSignal()
    return pointToBeAdded
  }

  toJSON(): TPolyJsonSpec{
    const { id, points, edges, space, name, desc } = this
    return {
      id,
      points: points.map(p => p.toJSON()),
      edges,
      space,
      name,
      desc,
      '@type': 'siibra-ex/annotation/polyline'
    }
  }

  toString() {
    return `Points: ${JSON.stringify(this.points.map(p => p.toString()))}, edges: ${JSON.stringify(this.edges)}.`
  }

  toSands(): TSandsPolyLine{
    return {
      "@id": this.id,
      "@type": 'tmp/poly',
      coordinateSpace: {
        '@id': this.space["@id"],
      },
      coordinatesPairs: this.edges.map(([ idx1, idx2 ]) => {
        const { x: x1, y: y1, z: z1 } = this.points[idx1]
        const { x: x2, y: y2, z: z2 } = this.points[idx2]
        return [
          [getCoord(x1), getCoord(y1), getCoord(z1)],
          [getCoord(x2), getCoord(y2), getCoord(z2)]
        ]
      })
    }
  }

  private getNgAnnotationId(edgeIdx: number){
    return `${this.id}_${edgeIdx}_0`
  }
  getNgAnnotationIds(){
    return this.edges.map((_, edgeIdx) => this.getNgAnnotationId(edgeIdx))
  }
  toNgAnnotation(): INgAnnotationTypes['line'][]{
    return this.edges.map((indices, edgeIdx) => {
      const pt1 = this.points[indices[0]]
      const pt2 = this.points[indices[1]]
      return {
        id: this.getNgAnnotationId(edgeIdx),
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

  static fromJSON(json: TPolyJsonSpec){
    return new Polygon(json)
  }

  constructor(spec?: TPolyJsonSpec){
    super(spec)
    const { points = [], edges = [] } = spec || {}
    this.points = points.map(Point.fromJSON)
    this.edges = edges
  }

  private sendUpdateSignal(){
    this.updateSignal$.next(this.toString())
  }

  public translate(x: number, y: number, z: number) {
    for (const p of this.points){
      p.translate(x, y, z)
    }
    this.sendUpdateSignal()
  }
}

export const POLY_ICON_CLASS = 'fas fa-draw-polygon'

export class ToolPolygon extends AbsToolClass implements IAnnotationTools, OnDestroy {
  static PREVIEW_ID='tool_poly_preview'

  public name = 'polygon'
  public iconClass = POLY_ICON_CLASS
  public toolType: TToolType = 'drawing'

  private selectedPoly: Polygon
  private lastAddedPoint: Point

  private managedAnnotations: Polygon[] = []
  public managedAnnotations$ = new Subject<Polygon[]>()

  public subs: Subscription[] = []
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
      this.metadataEv$.subscribe(ev => {
        this.space = ev.detail.space
      }),

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
          this.selectedPoly = new Polygon({
            edges: [],
            points: [],
            space: this.space,
            '@type': 'siibra-ex/annotation/polyline'
          })
          this.managedAnnotations.push(this.selectedPoly)
          this.managedAnnotations$.next(this.managedAnnotations)
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
          /**
           * only emit annotations in matching space
           */
          if (managedAnn.space["@id"] === this.space["@id"]) {
            out = out.concat(...managedAnn.toNgAnnotation())
          }
        }
        this.allNgAnnotations$.next(out)
      }),

      /**
       * translate point when on hover a point
       * translate entire annotation when hover edge
       */
      this.dragHoveredAnnotationsDelta$.subscribe(val => {
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

  removeAnnotation(id: string) {
    const idx = this.managedAnnotations.findIndex(ann => ann.id === id)
    if (idx < 0) {
      return
    }
    this.managedAnnotations.splice(idx, 1)
    this.managedAnnotations$.next(this.managedAnnotations)
    this.forceRefreshAnnotations$.next(null)
  }

  ngOnDestroy(){
    if (this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}
