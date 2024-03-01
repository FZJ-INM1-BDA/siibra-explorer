import { Directive, Inject, Input, Optional, inject } from "@angular/core";
import { Store } from "@ngrx/store";
import { concat, interval, of, Subject } from "rxjs";
import { debounce, distinctUntilChanged, filter, pairwise, take, takeUntil } from "rxjs/operators";
import { AnnotationLayer, TNgAnnotationAABBox, TNgAnnotationPoint } from "src/atlasComponents/annotations";
import { Feature, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { userInteraction } from "src/state";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { arrayEqual } from "src/util/array";
import { isVoiData } from "./guards"
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor, THoverConfig } from "src/util/injectionTokens";

@Directive({
  selector: '[voiBbox]',
  hostDirectives: [ DestroyDirective ]
})
export class VoiBboxDirective {

  #destory$ = inject(DestroyDirective).destroyed$

  static VOI_LAYER_NAME = 'voi-annotation-layer'
  static VOI_ANNOTATION_COLOR = "#ffff00"

  private _voiBBoxSvc: AnnotationLayer
  get voiBBoxSvc(): AnnotationLayer {
    if (this._voiBBoxSvc) return this._voiBBoxSvc
    try {
      const layer = AnnotationLayer.Get(
        VoiBboxDirective.VOI_LAYER_NAME,
        VoiBboxDirective.VOI_ANNOTATION_COLOR
      )
      this._voiBBoxSvc = layer
      layer.onHover.pipe(
        takeUntil(this.#destory$)
      ).subscribe(val => this.handleOnHoverFeature(val || {}))

      this.#destory$.subscribe(() => {
        this._voiBBoxSvc.dispose()
        this._voiBBoxSvc = null
      })
      return this._voiBBoxSvc
    } catch (e) {
      return null
    }
  }
  #annotationIdToFeature = new Map<string, VoiFeature>()
  #features$ = new Subject<VoiFeature[]>()
  #voiFeatures: VoiFeature[] = []
  
  @Input()
  set features(feats: Feature[]){
    this.#voiFeatures = (feats || []).filter(isVoiData)
    this.#features$.next(this.#voiFeatures)
  }
  get features(): VoiFeature[]{
    return this.#voiFeatures
  }

  #hoverMsgs: THoverConfig[] = []

  constructor(
    private store: Store,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR)
    clickInterceptor: ClickInterceptor,
    @Optional() @Inject(HOVER_INTERCEPTOR_INJECTOR) 
    private hoverInterceptor: HoverInterceptor,
  ){
    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      const handleClick = this.handleClick.bind(this)
      register(handleClick)
      this.#destory$.subscribe(() => deregister(handleClick))
    }

    concat(
      of([] as VoiFeature[]),
      this.#features$
    ).pipe(
      takeUntil(this.#destory$),
      distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
      pairwise(),
      debounce(() => 
        interval(16).pipe(
          filter(() => !!this.voiBBoxSvc),
          take(1),
        )
      ),
    ).subscribe(([ prev, curr ]) => {
      for (const v of prev) {
        const box = this.#pointsToAABB(v.bbox.maxpoint, v.bbox.minpoint)
        const point = this.#pointToPoint(v.bbox.center)
        this.#annotationIdToFeature.delete(box.id)
        this.#annotationIdToFeature.delete(point.id)
        if (!this.voiBBoxSvc) continue
        for (const ann of [box, point]) {
          this.voiBBoxSvc.removeAnnotation({
            id: ann.id
          })
        }
      }
      for (const v of curr) {
        const box = this.#pointsToAABB(v.bbox.maxpoint, v.bbox.minpoint)
        const point = this.#pointToPoint(v.bbox.center)
        this.#annotationIdToFeature.set(box.id, v)
        this.#annotationIdToFeature.set(point.id, v)
        if (!this.voiBBoxSvc) {
          throw new Error(`annotation is expected to be added, but annotation layer cannot be instantiated.`)
        }
        for (const ann of [box, point]) {
          this.voiBBoxSvc.updateAnnotation(ann)
        }
      }
      if (this.voiBBoxSvc) this.voiBBoxSvc.setVisible(true)
    })

    this.#destory$.subscribe(() => {
      this.store.dispatch(
        userInteraction.actions.setMouseoverVoi({ feature: null })
      )
      this.#dismissHoverMsg()
    })
  }

  #dismissHoverMsg(){
    if (!this.hoverInterceptor) {
      return
    }
    
    const { remove } = this.hoverInterceptor
    for (const msg of this.#hoverMsgs){
      remove(msg)
    }
  }

  #appendHoverMsg(feats: VoiFeature[]){
    if (!this.hoverInterceptor) {
      return
    }
    const { append } = this.hoverInterceptor
    this.#hoverMsgs = feats.map(feat => ({
      message: `${feat?.name}`,
      fontIcon: 'fa-database',
      fontSet: 'fas'
    }))
    for (const msg of this.#hoverMsgs){
      append(msg)
    }
  }

  handleClick(){
    if (this.#hoveredFeat) {
      this.store.dispatch(
        userInteraction.actions.showFeature({
          feature: this.#hoveredFeat
        })
      )
      return false
    }
    return true
  }

  #hoveredFeat: VoiFeature
  handleOnHoverFeature(ann: { id?: string }){
    const { id } = ann || {}
    const feature = this.#annotationIdToFeature.get(id)
    this.#hoveredFeat = feature
    this.store.dispatch(
      userInteraction.actions.setMouseoverVoi({ feature })
    )
    this.#dismissHoverMsg()
    if (feature) {
      this.#appendHoverMsg([feature])
    }
  }

  #pointsToAABB(pointA: [number, number, number], pointB: [number, number, number]): TNgAnnotationAABBox{
    return {
      id: `${VoiBboxDirective.VOI_LAYER_NAME}:${JSON.stringify(pointA)}:${JSON.stringify(pointB)}`,
      type: "aabbox",
      pointA: pointA.map(v => v*1e6) as [number, number, number],
      pointB: pointB.map(v => v*1e6) as [number, number, number],
    }
  }
  #pointToPoint(point: [number, number, number]): TNgAnnotationPoint{
    return {
      id: `${VoiBboxDirective.VOI_LAYER_NAME}:${JSON.stringify(point)}`,
      point: point.map(v => v*1e6) as [number, number, number],
      type: "point"
    }
  }
}
