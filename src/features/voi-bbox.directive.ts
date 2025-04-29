import { Directive, Inject, Input, Optional, inject } from "@angular/core";
import { Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, concat, of, Subject } from "rxjs";
import { debounceTime, map, takeUntil } from "rxjs/operators";
import { TNgAnnotationAABBox, TNgAnnotationPoint } from "src/atlasComponents/annotations";
import { Feature, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { userInteraction } from "src/state";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { isVoiData } from "./guards"
import { HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor, THoverConfig } from "src/util/injectionTokens";
import { AnnotationDirective } from "src/atlasComponents/annotations/annotation.directive";

type TripletNum = [number, number, number]

type DisplayedPoint = {
  id: string
  type: 'point'
  point: number[]
}

function isDisplayPoint(input: unknown): input is DisplayedPoint{
  return input?.['type'] === "point"
}

type DisplayedBox = {
  id: string
  type: 'box'
  minpoint: number[]
  maxpoint: number[]
  center: number[]
}

@Directive({
  selector: '[voiBbox]',
  hostDirectives: [ AnnotationDirective ]
})
export class VoiBboxDirective {

  #annotationDirective = inject(AnnotationDirective)  
  #destory$ = this.#annotationDirective.destroyed$

  static VOI_LAYER_NAME = 'voi-annotation-layer'
  static VOI_ANNOTATION_COLOR = "#ffff00"

  #annotationIdToFeatureId = new Map<string, string>()
  #featureIdToFeature = new Map<string, VoiFeature>()
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

  #pointGeometry$ = new BehaviorSubject<DisplayedPoint[]>([])
  @Input()
  set geometry(value: unknown) {
    if (!Array.isArray(value)) {
      this.#pointGeometry$.next([])
      return
    }
    this.#pointGeometry$.next(
      value.map(v => {
        const rv: DisplayedPoint = {
          id: JSON.stringify(v),
          point: v,
          type: 'point'
        }
        return rv
      })
    )
  }

  #boxedGeometry$ = concat(
    of([] as VoiFeature[]),
    this.#features$
  ).pipe(
    map(features => features.map(feat => {
      const b: DisplayedBox = {
        ...feat.bbox,
        type: 'box',
        id: feat.id
      }
      return b
    }))
  )

  #hoverMsgs: THoverConfig[] = []

  constructor(
    private store: Store,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR)
    clickInterceptor: ClickInterceptor,
    @Optional() @Inject(HOVER_INTERCEPTOR_INJECTOR) 
    private hoverInterceptor: HoverInterceptor,
  ){

    this.#annotationDirective.annotationColor = VoiBboxDirective.VOI_ANNOTATION_COLOR
    this.#annotationDirective.annotationLayerName = VoiBboxDirective.VOI_LAYER_NAME

    this.#annotationDirective.onHover.pipe(
      takeUntil(this.#destory$)
    ).subscribe(id => {
      this.handleOnHoverFeature(id && { id })
    })

    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      const handleClick = this.handleClick.bind(this)
      register(handleClick)
      this.#destory$.subscribe(() => deregister(handleClick))
    }

    this.#features$.pipe(
      takeUntil(this.#destory$),
    ).subscribe(features => {
      this.#annotationIdToFeatureId.clear()
      this.#featureIdToFeature.clear()
      for (const f of features){
        const aabb = this.#pointsToAABB(f.bbox.minpoint, f.bbox.maxpoint, `${f.id}-box`)
        const pt = this.#pointToPoint(f.bbox.center, `${f.id}-point`)
        this.#annotationIdToFeatureId.set(aabb.id, f.id)
        this.#annotationIdToFeatureId.set(pt.id, f.id)
        this.#featureIdToFeature.set(f.id, f)
      }
    })

    combineLatest([
      this.#boxedGeometry$,
      this.#pointGeometry$,
    ]).pipe(
      map(([ boxes, points ]) => [...boxes, ...points]),
      takeUntil(this.#destory$),
      debounceTime(16),
    ).subscribe(curr => {
      this.#annotationDirective.annotations = []
      
      const annotations = []
      for (const v of curr) {
        if (isDisplayPoint(v)) {
          annotations.push(v)
        } else {
          const box = this.#pointsToAABB(v.maxpoint as TripletNum, v.minpoint as TripletNum, `${v.id}-box`)
          const point = this.#pointToPoint(v.center as TripletNum, `${v.id}-point`)
          annotations.push(box, point)
        }
      }
      this.#annotationDirective.annotations = annotations
      this.#annotationDirective.ngOnChanges()
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

    const featureId = this.#annotationIdToFeatureId.get(id)
    const feature = this.#featureIdToFeature.get(featureId)
    this.#hoveredFeat = feature
    this.store.dispatch(
      userInteraction.actions.setMouseoverVoi({ feature })
    )
    this.#dismissHoverMsg()
    if (feature) {
      this.#appendHoverMsg([feature])
    }
  }

  #pointsToAABB(pointA: [number, number, number], pointB: [number, number, number], useId=null): TNgAnnotationAABBox{
    const id = useId || `${VoiBboxDirective.VOI_LAYER_NAME}:${JSON.stringify(pointA)}:${JSON.stringify(pointB)}`
    return {
      id,
      type: "aabbox",
      pointA: pointA.map(v => v*1e6) as [number, number, number],
      pointB: pointB.map(v => v*1e6) as [number, number, number],
    }
  }
  #pointToPoint(point: [number, number, number], useId=null): TNgAnnotationPoint{
    const id = useId || `${VoiBboxDirective.VOI_LAYER_NAME}:${JSON.stringify(point)}`
    return {
      id,
      point: point.map(v => v*1e6) as [number, number, number],
      type: "point"
    }
  }
}
