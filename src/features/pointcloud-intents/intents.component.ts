import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Inject, InjectionToken, Input, Optional, Output, inject } from "@angular/core";
import { BehaviorSubject, Observable, combineLatest } from "rxjs";
import { Point, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";
import { AngularMaterialModule } from "src/sharedModules";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { CFIndex } from "./util";
import { AnnotationLayer } from "src/atlasComponents/annotations";
import { map, takeUntil, withLatestFrom } from "rxjs/operators";
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor, HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor, THoverConfig } from "src/util/injectionTokens";

type Intent = PathReturn<"/feature/{feature_id}/intents">['items'][number]

type Annotation = {
  id: string
  type: 'point'
  point: [number, number, number]
}

function serializeToId(pt: Point): Annotation{
  return {
    id: `${pt.spaceId}-${pt.loc.join("-")}`,
    type: 'point',
    point: pt.loc.map(v => v*1e6) as [number, number, number]
  }
}

@Component({
  selector: 'pointcloud-intents',
  templateUrl: './intents.template.html',
  styleUrls: [
    './intents.style.css'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule
  ],
  hostDirectives: [
    DestroyDirective
  ]
})

export class PointCloudIntents {

  readonly #destroy$ = inject(DestroyDirective).destroyed$

  // not yet used
  #intents: Observable<Intent[]>

  #points$ = new BehaviorSubject<CFIndex<Point>[]>([] as CFIndex<Point>[])
  #selectedTemplate$ = new BehaviorSubject<SxplrTemplate>(null)

  @Input('points')
  set points(val: CFIndex<Point>[]) {
    this.#points$.next(val)
  }

  @Input('selected-template')
  set selectedTemplate(tmpl: SxplrTemplate){
    this.#selectedTemplate$.next(tmpl)
  }

  #spaceMatchedCfIndices$ = combineLatest([
    this.#points$,
    this.#selectedTemplate$
  ]).pipe(
    map(([ points, selectedTemplate ]) => points.filter(p => p.index.spaceId === selectedTemplate?.id))
  )

  #spaceMatchedAnnIdToCfIdx$ = this.#spaceMatchedCfIndices$.pipe(
    map(indices => {
      const idToIndexMap = new Map<string, CFIndex<Point>>()
      for (const idx of indices){
        idToIndexMap.set(
          serializeToId(idx.index).id,
          idx
        )
      }
      return idToIndexMap
    })
  )

  @Output('point-clicked')
  pointClicked = new EventEmitter<CFIndex<Point>>()

  annLayer: AnnotationLayer
  constructor(
    @Inject(RENDER_CF_POINT) render: RenderCfPoint,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
    @Optional() @Inject(HOVER_INTERCEPTOR_INJECTOR) hoverInterceptor: HoverInterceptor,
  ){
    this.annLayer = new AnnotationLayer("intents", "#ff0000")
    this.#spaceMatchedCfIndices$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(indices => {
      const anns = indices.map(idx => serializeToId(idx.index))
      this.annLayer.addAnnotation(anns)
    },
    e => {
      console.error("error", e)
    },
    () => {
      this.annLayer.dispose()
    })

    this.annLayer.onHover.pipe(
      takeUntil(this.#destroy$),
      withLatestFrom(this.#spaceMatchedAnnIdToCfIdx$),
    ).subscribe(([hover, map]) => {

      if (hoverInterceptor && !!this.#hoveredMessage){
        const { remove } = hoverInterceptor
        remove(this.#hoveredMessage)
        this.#hoveredMessage = null
      }

      this.#hoveredCfIndex = null

      if (!hover) {
        return
      }

      const idx = map.get(hover.id)
      if (!idx) {
        console.error(`Couldn't find AnnId: ${hover.id}`)
        return
      }

      this.#hoveredCfIndex = idx

      if (hoverInterceptor) {
        const { append } = hoverInterceptor
        const text = render(idx)
        this.#hoveredMessage = {
          message: `Hovering ${text}`
        }
        append(this.#hoveredMessage)
      }
    })

    this.#destroy$.subscribe(() => {
      if (hoverInterceptor) {
        const { remove } = hoverInterceptor
        if (this.#hoveredMessage) {
          remove(this.#hoveredMessage)
          this.#hoveredMessage = null
        }
      }
    })

    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      const onClickHandler = this.onViewerClick.bind(this)
      register(onClickHandler)
      this.#destroy$.subscribe(() => deregister(onClickHandler))
    }
  }

  onViewerClick(){
    if (this.#hoveredCfIndex) {
      this.pointClicked.next(this.#hoveredCfIndex)
      return false
    }
    return true
  }

  #hoveredCfIndex: CFIndex<Point> = null
  #hoveredMessage: THoverConfig = null

}

export const RENDER_CF_POINT = new InjectionToken("RENDER_CF_POINT")
export type RenderCfPoint = (cfIndex: CFIndex<Point>) => string
