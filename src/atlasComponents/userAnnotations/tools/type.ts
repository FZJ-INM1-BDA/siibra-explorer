import { InjectionToken } from "@angular/core"
import { merge, Observable, of, Subject, Subscription } from "rxjs"
import { filter, map, mapTo, pairwise, switchMap, switchMapTo, takeUntil, withLatestFrom } from 'rxjs/operators'
import { getUuid } from "src/util/fn"

/**
 * base class to be extended by all annotation tools
 * TODO perhaps split into drawing subclass/utility subclass
 */

export abstract class AbsToolClass {

  public abstract name: string
  public abstract iconClass: string

  public abstract removeAnnotation(id: string): void
  public abstract managedAnnotations$: Observable<IAnnotationGeometry[]>

  abstract subs: Subscription[]
  protected space: TBaseAnnotationGeomtrySpec['space']

  /**
   * @description to be overwritten by subclass. Emit the latest representation of NgAnnotations from the tool.
   */
  public abstract allNgAnnotations$: Observable<INgAnnotationTypes[keyof INgAnnotationTypes][]>

  /**
   * @description to be overwritten by subclass. Called once every mousemove event, if the tool is active.
   * @param {[number, number, number]} mousepos
   * @returns {INgAnnotationTypes[keyof INgAnnotationTypes][]} Array of NgAnnotation to be rendered.
   */
  public abstract onMouseMoveRenderPreview(mousepos: [number, number, number]): INgAnnotationTypes[keyof INgAnnotationTypes][]

  constructor(
    protected annotationEv$: Observable<TAnnotationEvent<keyof IAnnotationEvents>>,
    protected callback?: TCallbackFunction
  ){

  }

  init(){
    this.subs.push(
      this.metadataEv$.subscribe(ev => {
        this.space = ev.detail.space
      })
    )
  }

  public toolSelected$ = this.annotationEv$.pipe(
    filter(ev => ev.type === 'toolSelect'),
    map(ev => (ev as TAnnotationEvent<'toolSelect'>).detail.name === this.name)
  )

  protected metadataEv$ = this.annotationEv$.pipe(
    filter(ev => ev.type === 'metadataEv'),
  ) as Observable<TAnnotationEvent<'metadataEv'>>

  protected mouseDown$ = this.annotationEv$.pipe(
    filter(ev => ev.type === 'mousedown')
  ) as Observable<TAnnotationEvent<'mousedown'>>

  protected mouseUp$ = this.annotationEv$.pipe(
    filter(ev => ev.type === 'mouseup')
  ) as Observable<TAnnotationEvent<'mouseup'>>

  protected mouseMove$ = this.annotationEv$.pipe(
    filter(ev => ev.type === 'mousemove')
  ) as Observable<TAnnotationEvent<'mousemove'>>

  protected mouseClick$ = this.mouseDown$.pipe(
    switchMap(ev => this.mouseUp$.pipe(
      takeUntil(this.mouseMove$),
      mapTo(ev)
    ))
  )

  protected hoverAnnotation$ = this.annotationEv$.pipe(
    filter(ev => ev.type === 'hoverAnnotation')
  ) as Observable<TAnnotationEvent<'hoverAnnotation'>>

  /**
   * on mouseover, then drag annotation
   * use mousedown as obs src, since hoverAnnotation$ is a bit trigger happy
   * check if there is a hit on mousedown trigger
   *
   * if true - stop mousedown propagation, switchmap to mousemove
   * if false -
   *
   */
  protected dragHoveredAnnotation$: Observable<{
    startNgX: number
    startNgY: number
    startNgZ: number
    currNgX: number
    currNgY: number
    currNgZ: number
    ann: TAnnotationEvent<"hoverAnnotation">
  }> = this.mouseDown$.pipe(
    withLatestFrom(this.hoverAnnotation$),
    switchMap(([ mousedown, ann ]) => {
      if (!(ann.detail)) return of(null)
      const { ngMouseEvent, event } = mousedown.detail
      event.stopPropagation()
      const { x: startNgX, y: startNgY, z: startNgZ } = ngMouseEvent
      return this.mouseMove$.pipe(
        takeUntil(this.mouseUp$),
        map(ev => {
          const { x: currNgX, y: currNgY, z: currNgZ } = ev.detail.ngMouseEvent
          return {
            startNgX,
            startNgY,
            startNgZ,
            currNgX,
            currNgY,
            currNgZ,
            ann,
          }
        })
      )
    }),
    filter(v => !!v)
  )


  /**
   * emit on init, and reset on mouseup$
   * otherwise, pairwise confuses last drag event and first drag event
   */
  protected dragHoveredAnnotationsDelta$: Observable<{
    ann: TAnnotationEvent<"hoverAnnotation">
    deltaX: number
    deltaY: number
    deltaZ: number
  }> = merge(
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
  )
}

export type TToolType = 'selecting' | 'drawing' | 'deletion'

export type TCallback = {
  paintingEnd: {
    callArg: {}
    returns: void
  }
  requestManAnnStreeam: {
    callArg: {}
    returns: Observable<IAnnotationGeometry[]>
  }
}

export type TCallbackFunction = <T extends keyof TCallback>(arg: TCallback[T]['callArg'] & { type: T }) => TCallback[T]['returns'] | void

export type TBaseAnnotationGeomtrySpec = {
  id?: string
  space?: {
    ['@id']: string
  }
  name?: string
  desc?: string
}

export function getCoord(value: number): TSandsQValue {
  return {
    '@id': getUuid(),
    '@type': "https://openminds.ebrains.eu/core/QuantitativeValue",
    value,
    unit: {
      "@id": 'id.link/mm'
    }
  }
}

type TSandsQValue = {
  '@id': string
  '@type': 'https://openminds.ebrains.eu/core/QuantitativeValue'
  uncertainty?: [number, number]
  value: number
  unit: {
    '@id': 'id.link/mm'
  }
}
type TSandsCoord = [TSandsQValue, TSandsQValue] | [TSandsQValue, TSandsQValue, TSandsQValue]

export type TSandsPolyLine = {
  coordinatesPairs: [TSandsCoord, TSandsCoord][]
  coordinateSpace: {
    '@id': string
  }
  '@type': 'tmp/poly'
  '@id': string
}

export type TSandsLine = {
  coordinatesFrom: TSandsCoord
  coordinatesTo: TSandsCoord
  coordinateSpace: {
    '@id': string
  }
  '@type': 'tmp/line'
  '@id': string
}

export type TSandsPoint = {
  coordinates: TSandsCoord
  coordinateSpace: {
    '@id': string
  }
  '@type': 'https://openminds.ebrains.eu/sands/CoordinatePoint'
  '@id': string
}

export interface ISandsAnnotation {
  point: TSandsPoint
  line: TSandsLine
  polyline: TSandsPolyLine
}

export abstract class Highlightable {

  public highlighted = false
  constructor(defaultFlag?: boolean){
    if (typeof defaultFlag !== 'undefined') {
      this.highlighted = defaultFlag
    }
  }
  setHighlighted(flag: boolean){
    this.highlighted = flag
  }
}

export abstract class IAnnotationGeometry extends Highlightable {
  public id: string
  
  public name: string
  public desc: string

  public space: TBaseAnnotationGeomtrySpec['space']

  abstract getNgAnnotationIds(): string[]
  abstract toNgAnnotation(): INgAnnotationTypes[keyof INgAnnotationTypes][]
  abstract toJSON(): object
  abstract toString(): string
  abstract toSands(): ISandsAnnotation[keyof ISandsAnnotation]

  public remove() {
    throw new Error(`The remove method needs to be overwritten by the tool manager`)
  }
  public updateSignal$ = new Subject()

  constructor(spec?: TBaseAnnotationGeomtrySpec){
    super()
    this.id = spec && spec.id || getUuid()
    this.space = spec?.space
    this.name = spec?.name
    this.desc = spec?.desc
  }

  setName(name: string) {
    this.name = name
    this.updateSignal$.next(this.toString())
  }
  setDesc(desc: string) {
    this.desc = desc
    this.updateSignal$.next(this.toString())
  }
}

export interface IAnnotationTools {
  name: string
  iconClass: string
  toolType: TToolType
}

export type TNgAnnotationEv = {
  pickedAnnotationId: string
  pickedOffset: number
}

export type TNgMouseEvent = {
  event: MouseEvent
  ngMouseEvent: {
    x: number
    y: number
    z: number
  }
}

export type TMetaEvent = {
  space: { ['@id']: string }
}

export interface IAnnotationEvents {
  toolSelect: {
    name: string
  }
  mousemove: TNgMouseEvent
  mousedown: TNgMouseEvent
  mouseup: TNgMouseEvent
  hoverAnnotation: TNgAnnotationEv

  metadataEv: TMetaEvent
}

export type TAnnotationEvent<T extends keyof IAnnotationEvents> = {
  type: T
  detail: IAnnotationEvents[T]
}

export const ANNOTATION_EVENT_INJ_TOKEN = new InjectionToken<
  Observable<TAnnotationEvent<keyof IAnnotationEvents>>
>('ANNOTATION_EVENT_INJ_TOKEN')


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

export interface INgAnnotationTypes {
  line: TNgAnnotationLine
  point: TNgAnnotationPoint
}

export const INJ_ANNOT_TARGET = new InjectionToken<Observable<HTMLElement>>('INJ_ANNOT_TARGET')
export const UDPATE_ANNOTATION_TOKEN = new InjectionToken<IAnnotationGeometry>('UDPATE_ANNOTATION_TOKEN')

export interface ClassInterface<T> {
  new (...arg: any[]): T
}

export type TExportFormats = 'sands' | 'json' | 'string'
