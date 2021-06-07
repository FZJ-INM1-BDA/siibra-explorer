import { InjectionToken } from "@angular/core"
import { Observable } from "rxjs"
import { filter, map, mapTo, switchMap, takeUntil, tap } from 'rxjs/operators'
import { getUuid } from "src/util/fn"

export type TToolType = 'translation' | 'drawing' | 'deletion'

type THasId = {
  id?: string
}
export abstract class IAnnotationGeometry {
  public id: string
  
  abstract toNgAnnotation(): INgAnnotationTypes[keyof INgAnnotationTypes][]
  abstract toJSON(): object

  constructor(spec?: THasId){
    this.id = spec && spec.id || getUuid()
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

export abstract class AbsToolClass {

  public abstract name: string
  public abstract iconClass: string

  /**
   * @description check if any specific annotation is relevant to the tool. Used for filtering annotations
   * @param {TNgAnnotationEv} annotation
   * @returns {boolean} if annotation is relevant to this tool
   */
  public abstract ngAnnotationIsRelevant(hoverEv: TNgAnnotationEv): boolean

  public abstract allNgAnnotations$: Observable<INgAnnotationTypes[keyof INgAnnotationTypes][]>

  constructor(
    protected annotationEv$: Observable<TAnnotationEvent<keyof IAnnotationEvents>>
  ){

  }

  public toolSelected$ = this.annotationEv$.pipe(
    filter(ev => ev.type === 'toolSelect'),
    map(ev => (ev as TAnnotationEvent<'toolSelect'>).detail.name === this.name)
  )

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

  protected hoverAnnotationMouseDown$ = this.hoverAnnotation$.pipe(
    tap(console.log),
    filter(ev => !!this.ngAnnotationIsRelevant(ev.detail)),
    switchMap(hoverAnnotationEv => this.mouseDown$.pipe(
      map(mouseDownEv => {
        return {
          ngAnnotationEv: hoverAnnotationEv.detail,
          mouseEvent: mouseDownEv.detail.event
        }
      })
    ))
  )
}

export interface IAnnotationEvents {
  toolSelect: {
    name: string
  }
  mousemove: TNgMouseEvent
  mousedown: TNgMouseEvent
  mouseup: TNgMouseEvent
  hoverAnnotation: TNgAnnotationEv
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
