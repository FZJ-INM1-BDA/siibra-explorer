import { IAnnotationTools, IAnnotationGeometry, TAnnotationEvent, IAnnotationEvents, AbsToolClass, INgAnnotationTypes, TNgAnnotationEv, TToolType, TBaseAnnotationGeomtrySpec, TSandsPolyLine, getCoord, TCallbackFunction } from "./type";
import { Point, TPointJsonSpec } from './point'
import { Directive, OnDestroy } from "@angular/core";
import { merge, Observable, Subject, Subscription } from "rxjs";
import { filter, switchMapTo, takeUntil, withLatestFrom } from "rxjs/operators";
import { getUuid } from "src/util/fn";

export type TPolyJsonSpec = {
  points: (TPointJsonSpec|Point)[]
  edges: [number, number][]
  '@type': 'siibra-ex/annotation/polyline'
} & TBaseAnnotationGeomtrySpec

export class Polygon extends IAnnotationGeometry{
  public id: string
  public annotationType = 'Polygon'

  public points: Point[] = []
  public edges: [number, number][] = []

  public hasPoint(p: Point): boolean {
    return this.points.indexOf(p) >= 0
  }

  private ptWkMp = new WeakMap<Point, {
    onremove: () => void
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

    this.changed()
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
        '@type': 'siibra-ex/annotation/point',
        ...p
      })
    
    if (!this.hasPoint(pointToBeAdded)) {
      this.points.push(pointToBeAdded)
      const sub = pointToBeAdded.updateSignal$.subscribe(
        () => this.changed()
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
    this.changed()
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
    return `Name: ${this.name}, Desc: ${this.desc}, Points: ${JSON.stringify(this.points.map(p => p.toString()))}, edges: ${JSON.stringify(this.edges)}.`
  }

  toSands(): TSandsPolyLine{
    return {
      "@id": this.id,
      "@type": 'tmp/poly',
      coordinateSpace: {
        '@id': this.space["@id"],
      },
      coordinates: this.points.map(p => {
        const { x, y, z } = p
        return [getCoord(x/1e6), getCoord(y/1e6), getCoord(z/1e6)]
      }),
      closed: true
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

  static fromSANDS(sands: TSandsPolyLine): Polygon {
    const {
      "@id": id,
      "@type": type,
      coordinateSpace,
      coordinates
    } = sands
    const { ["@id"]: spaceId } = coordinateSpace
    if (type === 'tmp/poly') {
      const points: Point[] = []
      const edges: [number, number][] = []
      for (const coordinate of coordinates) {
        const parsedValue = coordinate.map(c => {
          if (c.unit["@id"] !== 'id.link/mm') throw new Error(`Unit does not parse`)
          return c.value * 1e6
        })
        const p = new Point({
          space: {
            id: spaceId
          },
          x: parsedValue[0],
          y: parsedValue[1],
          z:  parsedValue[2],
          "@type": "siibra-ex/annotation/point"
        })
        const newIdx = points.push(p)
        if (newIdx > 1) {
          edges.push([ newIdx - 2, newIdx - 1 ])
        }
      }

      const poly = new Polygon({
        id,
        "@type": 'siibra-ex/annotation/polyline',
        space: { id: spaceId },
        points,
        edges
      })
      return poly
    }

    throw new Error(`cannot import sands`)
  }

  constructor(spec?: TPolyJsonSpec){
    super(spec)
    const { points = [], edges = [] } = spec || {}
    this.points = points.map(p => {
      if (p instanceof Point) return p
      return Point.fromJSON(p)
    })
    this.edges = edges
  }

  public translate(x: number, y: number, z: number) {
    for (const p of this.points){
      p.translate(x, y, z)
    }
    this.changed()
  }
}

export const POLY_ICON_CLASS = 'fas fa-draw-polygon'

@Directive()
export class ToolPolygon extends AbsToolClass<Polygon> implements IAnnotationTools, OnDestroy {
  static PREVIEW_ID='tool_poly_preview'

  public name = 'polygon'
  public iconClass = POLY_ICON_CLASS
  public toolType: TToolType = 'drawing'

  private selectedPoly: Polygon
  private lastAddedPoint: Point

  protected managedAnnotations: Polygon[] = []
  public managedAnnotations$ = new Subject<Polygon[]>()

  public subs: Subscription[] = []

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
      this.metadataEv$.subscribe(ev => {
        this.space = ev.detail.space
      }),

      /**
       * on end tool select
       */
      toolDeselect$.subscribe(() => {

        /**
         * cleanup poly on tool deselect
         */
        if (this.selectedPoly) {

          const { edges, points } = this.selectedPoly
          /**
           * check if closed. if not close, close it
           */
          if (edges.length > 0) {

            if (edges[edges.length - 1].every(v => v !== 0)) {
              this.selectedPoly.addPoint(
                points[0],
                points[points.length - 1]
              )
            }
          }

          /**
           * if edges < 3, discard poly
           */
          if (edges.length < 3) {
            this.removeAnnotation(this.selectedPoly)
          }
        }

        this.managedAnnotations$.next(this.managedAnnotations)

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
          const newPoly =  new Polygon({
            edges: [],
            points: [],
            space: this.space,
            '@type': 'siibra-ex/annotation/polyline'
          })
          this.addAnnotation(newPoly)
          this.selectedPoly = newPoly
        } else {

          if (ann.detail) {
            const { pickedAnnotationId, pickedOffset } = ann.detail
            const out = this.selectedPoly.parseNgAnnotationObj(pickedAnnotationId, pickedOffset)
            const isFirstPoint = out?.point === this.selectedPoly.points[0]
            if (isFirstPoint) {
              this.selectedPoly.addPoint(
                this.selectedPoly.points[0],
                this.lastAddedPoint
              )

              if (this.callback) {
                this.callback({
                  type: 'message',
                  message: 'Polyline added.',
                  action: 'Open',
                  actionCallback: () => this.callback({ type: 'showList' })
                })
                this.callback({
                  type: 'paintingEnd',
                })
              }
              return
            }
          }
  
        }

        const addedPoint = this.selectedPoly.addPoint(
          mouseev.detail.ngMouseEvent,
          this.lastAddedPoint
        )
        this.lastAddedPoint = addedPoint

        /**
         * always emit new annotation onclick
         */
        this.managedAnnotations$.next(this.managedAnnotations)
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

        this.managedAnnotations$.next(this.managedAnnotations)
      }),
    )
  }

  ngOnDestroy(){
    if (this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}
