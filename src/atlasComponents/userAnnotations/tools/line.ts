import {
  IAnnotationTools,
  IAnnotationGeometry,
  TAnnotationEvent,
  IAnnotationEvents,
  AbsToolClass,
  INgAnnotationTypes,
  TToolType,
  TSandsLine,
  getCoord,
  TBaseAnnotationGeomtrySpec,
  TCallbackFunction,
} from "./type";
import { Point, TPointJsonSpec } from './point'
import { Directive, OnDestroy } from "@angular/core";
import { Observable, Subject, Subscription } from "rxjs";
import { filter, switchMapTo, takeUntil } from "rxjs/operators";
import { getUuid } from "src/util/fn";
import { MM_IDS } from "src/util/types";

export type TLineJsonSpec = {
  '@type': 'siibra-ex/annotation/line'
  points: (TPointJsonSpec|Point)[]
} & TBaseAnnotationGeomtrySpec

export class Line extends IAnnotationGeometry{
  public annotationType = 'Line'

  public points: Point[] = []

  public hasPoint(p: Point) {
    return this.points.indexOf(p) >= 0
  }

  public addLinePoints(p: Point | {x: number, y: number, z: number}): Point {
    if (this.checkComplete()) {
      throw new Error(`This line is already complete!`)
    }
    const point = p instanceof Point
      ? p
      : new Point({
        id: `${this.id}_${getUuid()}`,
        "@type": 'siibra-ex/annotation/point',
        space: this.space,
        ...p
      })
    if (!this.points[0]) this.points[0] = point
    else this.points[1] = point
    this.changed()
    return point
  }

  getNgAnnotationIds() {
    return [this.id]
  }

  private checkComplete(){
    return this.points.length >= 2
  }

  toString(): string {
    if (!this.checkComplete()) {
      return `Line incomplete.`
    } 
    
    return `Line from ${this.points[0].toString()} to ${this.points[1].toString()}`
  }

  toSands(): TSandsLine {
    if (!this.checkComplete()) {
      return null
    }
    const {
      x: x0, y: y0, z: z0
    } = this.points[0]

    const {
      x: x1, y: y1, z: z1
    } = this.points[1]

    const { id } = this.space
    return {
      '@id': this.id,
      '@type': "tmp/line",
      coordinateSpace: {
        '@id': id
      },
      coordinatesFrom: [getCoord(x0/1e6), getCoord(y0/1e6), getCoord(z0/1e6)],
      coordinatesTo: [getCoord(x1/1e6), getCoord(y1/1e6), getCoord(z1/1e6)],
      ...this.sxplrProp(),
    }
  }

  toNgAnnotation(): INgAnnotationTypes['line'][] {
    if (!this.checkComplete()) return []
    const pt1 = this.points[0]
    const pt2 = this.points[1]
    return [{
      id: this.id,
      pointA: [pt1.x, pt1.y, pt1.z],
      pointB: [pt2.x, pt2.y, pt2.z],
      type: 'line',
      description: ''
    }]

  }

  toJSON(): TLineJsonSpec{
    const { id, name, desc, points, space } = this
    return {
      id,
      name,
      desc,
      points: points.map(p => p.toJSON()),
      space,
      '@type': 'siibra-ex/annotation/line'
    }
  }

  static fromJSON(json: TLineJsonSpec){
    return new Line(json)
  }

  static fromSANDS(json: TSandsLine): Line{
    const {
      "@id": id,
      "@type": type,
      coordinateSpace,
      coordinatesFrom,
      coordinatesTo
    } = json
    const { ['@id']: spaceId } = coordinateSpace
    if (type !== 'tmp/line') throw new Error(`cannot parse line from sands`)
    const fromPt = coordinatesFrom.map(c => {
      if (!MM_IDS.includes(c.unit["@id"])) throw new Error(`Cannot parse unit`)
      return c.value * 1e6
    })
    const toPoint = coordinatesTo.map(c => {
      if (!MM_IDS.includes(c.unit["@id"])) throw new Error(`Cannot parse unit`)
      return c.value * 1e6
    })
    const line = new Line({
      id,
      "@type": "siibra-ex/annotation/line",
      points: [
        new Point({
          "@type": 'siibra-ex/annotation/point',
          x: fromPt[0],
          y: fromPt[1],
          z: fromPt[2],
          space: { id: spaceId }
        }),
        new Point({
          '@type': "siibra-ex/annotation/point",
          x: toPoint[0],
          y: toPoint[1],
          z: toPoint[2],
          space: { id: spaceId }
        })
      ],
      space: { id: spaceId }
    })
    line.parseSxplrProp(json)
    return line
  }

  constructor(spec?: TLineJsonSpec){
    super(spec)
    const { points = [] } = spec || {}
    this.points = points.map(p => {
      if (p instanceof Point) return p
      return Point.fromJSON(p)
    })
  }

  public translate(x: number, y: number, z: number) {
    for (const p of this.points){
      p.translate(x, y, z)
    }
    this.changed()
  }
}

export const LINE_ICON_CLASS = 'fas fa-slash'

@Directive()
export class ToolLine extends AbsToolClass<Line> implements IAnnotationTools, OnDestroy {
  static PREVIEW_ID='tool_line_preview'
  public name = 'Line'
  public toolType: TToolType = 'drawing'
  public iconClass = LINE_ICON_CLASS

  private selectedLine: Line
  
  subs: Subscription[] = []

  protected managedAnnotations: Line[] = []
  public managedAnnotations$ = new Subject<Line[]>()

  onMouseMoveRenderPreview(pos: [number, number, number]) {
    if (this.selectedLine && !!this.selectedLine.points[0]) {
      const { x, y, z } = this.selectedLine.points[0]
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
    annotationEv$: Observable<TAnnotationEvent<keyof IAnnotationEvents>>,
    callback?: TCallbackFunction
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
       * on end tool select
       */
      toolDeselect$.subscribe(() => {
        /**
         * if line is not completed by tool deselect
         * it only has a single point, and should be removed
         */
        if (this.selectedLine) {
          this.removeAnnotation(this.selectedLine)
        }
        this.selectedLine = null
      }),
      /**
       * on tool selected
       * on mouse down
       * until tool deselected
       */
      toolSelThenClick$.pipe(
      ).subscribe(mouseev => {
        const crd = mouseev.detail.ngMouseEvent
        if (!this.selectedLine) {
          const newLine = new Line({
            space: this.space,
            "@type": 'siibra-ex/annotation/line',
            points: []
          })
          newLine.addLinePoints(crd)
          this.addAnnotation(newLine)
          this.selectedLine = newLine
        } else {

          this.selectedLine.addLinePoints(crd)
          this.selectedLine = null
          this.managedAnnotations$.next(this.managedAnnotations)
          if (this.callback) {
            this.callback({
              type: 'message',
              message: 'Line added.',
              action: 'Open',
              actionCallback: () => this.callback({ type: 'showList' })
            })
            this.callback({ type: 'paintingEnd' })
          }
        }
      }),

      /**
       * emit on init, and reset on mouseup$
       * otherwise, pairwise confuses last drag event and first drag event
       */
      this.dragHoveredAnnotationsDelta$.subscribe(val => {
        
        const { ann, deltaX, deltaY, deltaZ } = val
        const { pickedAnnotationId, pickedOffset } = ann.detail

        const annotation = this.managedAnnotations.find(an => an.id === pickedAnnotationId)
        if (!annotation) {
          return null
        }
        
        if (pickedOffset === 2) {
          annotation.points[1].translate(deltaX, deltaY, deltaZ)
        } else if (pickedOffset === 1) {
          annotation.points[0].translate(deltaX, deltaY, deltaZ)
        } else {
          annotation.translate(deltaX, deltaY, deltaZ)
        }
        this.managedAnnotations$.next(this.managedAnnotations)
      })
    )
  }

  ngOnDestroy(){
    this.subs.forEach(s => s.unsubscribe())
  }
}
