import { InjectionToken } from "@angular/core"
import { Observable, of } from "rxjs"
import { filter, map, mapTo, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators'
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

/**
 * base class to be extended by all annotation tools
 */
export abstract class AbsToolClass {

  public abstract name: string
  public abstract iconClass: string

  /**
   * @description to be overwritten by subclass. Check if a given annotation is relevant to the tool. Used for filtering annotations.
   * @param {TNgAnnotationEv} annotation
   * @returns {boolean} if annotation is relevant to this tool
   */
  public abstract ngAnnotationIsRelevant(hoverEv: TNgAnnotationEv): boolean

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

export const INJ_ANNOT_TARGET = new InjectionToken<Observable<HTMLElement>>('INJ_ANNOT_TARGET')
