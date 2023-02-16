import { Directive, EventEmitter, Inject, Input, OnChanges, OnDestroy, Optional, Output, SimpleChanges } from "@angular/core";
import { interval, merge, Observable, of, Subject, Subscription } from "rxjs";
import { debounce, debounceTime, distinctUntilChanged, filter, pairwise, shareReplay, startWith, switchMap, take, tap } from "rxjs/operators";
import { AnnotationLayer, TNgAnnotationPoint, TNgAnnotationAABBox } from "src/atlasComponents/annotations";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { BoundingBox, SxplrAtlas, SxplrTemplate, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";

import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { arrayEqual } from "src/util/array";

@Directive({
  selector: '[sxplr-sapiviews-features-voi-query]',
  exportAs: 'sxplrSapiViewsFeaturesVoiQuery'
})

export class SapiViewsFeaturesVoiQuery implements OnChanges, OnDestroy{

  static VOI_LAYER_NAME = 'voi-annotation-layer'
  static VOI_ANNOTATION_COLOR = "#ffff00"
  private voiQuerySpec = new Subject<{
    atlas: SxplrAtlas
    space: SxplrTemplate
    bbox: BoundingBox
  }>()

  private canFetchVoi(){
    return !!this.atlas && !!this.space && !!this.bbox
  }
  
  @Input('sxplr-sapiviews-features-voi-query-atlas')
  atlas: SxplrAtlas

  @Input('sxplr-sapiviews-features-voi-query-space')
  space: SxplrTemplate

  @Input('sxplr-sapiviews-features-voi-query-bbox')
  bbox: BoundingBox

  @Output('sxplr-sapiviews-features-voi-query-onhover')
  onhover = new EventEmitter<VoiFeature>()

  @Output('sxplr-sapiviews-features-voi-query-onclick')
  onclick = new EventEmitter<VoiFeature>()

  public busy$ = new EventEmitter<boolean>()
  public features$: Observable<VoiFeature[]> = this.voiQuerySpec.pipe(
    debounceTime(160),
    tap(() => this.busy$.emit(true)),
    switchMap(({ atlas, bbox, space }) => {
      if (!this.canFetchVoi()) {
        return of([])
      }
      return merge(
        of([]),
        this.sapi.getVoiFeatures(bbox)
      )
    }),
    startWith([]),
    shareReplay(1)
  )

  private hoveredFeat: VoiFeature
  private onDestroyCb: (() => void)[] = []
  private subscription: Subscription[] = []
  ngOnChanges(simpleChanges: SimpleChanges): void {
    if (simpleChanges.space) {
      this.voiBBoxSvc = null
    }
    const {
      atlas,
      space,
      bbox
    } = this
    this.voiQuerySpec.next({ atlas, space, bbox })
  }
  ngOnDestroy(): void {
    if (this.voiBBoxSvc) this.voiBBoxSvc.dispose()
    while (this.subscription.length > 0) this.subscription.pop().unsubscribe()
    while (this.voiSubs.length > 0) this.voiSubs.pop().unsubscribe()
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  handleOnHoverFeature({ id }: { id?: string }){
    const ann = this.annotationIdToFeature.get(id)
    this.hoveredFeat = ann
    this.onhover.emit(ann)
  }

  private voiSubs: Subscription[] = []
  private _voiBBoxSvc: AnnotationLayer
  get voiBBoxSvc(): AnnotationLayer {
    if (this._voiBBoxSvc) return this._voiBBoxSvc
    try {
      const layer = AnnotationLayer.Get(
        SapiViewsFeaturesVoiQuery.VOI_LAYER_NAME,
        SapiViewsFeaturesVoiQuery.VOI_ANNOTATION_COLOR
      )
      this._voiBBoxSvc = layer
      this.voiSubs.push(
        layer.onHover.subscribe(val => this.handleOnHoverFeature(val || {}))
      )
      return layer
    } catch (e) {
      return null
    }
  }
  set voiBBoxSvc(val) {
    if (!!val) {
      throw new Error(`cannot set voiBBoxSvc directly`)
    }
    while (this.voiSubs.length > 0) this.voiSubs.pop().unsubscribe()
    this._voiBBoxSvc && this._voiBBoxSvc.dispose()
    this._voiBBoxSvc = null
  }

  constructor(
    private sapi: SAPI,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
  ){
    const handle = () => {
      if (!this.hoveredFeat) return true
      this.onclick.emit(this.hoveredFeat)
      return false
    }
    this.onDestroyCb.push(
      () => clickInterceptor.deregister(handle)
    )
    clickInterceptor.register(handle)
    this.subscription.push(
      this.features$.pipe(
        startWith([] as VoiFeature[]),
        distinctUntilChanged(arrayEqual((o, n) => o["@id"] === n["@id"])),
        pairwise(),
        debounce(() => 
          interval(16).pipe(
            filter(() => !!this.voiBBoxSvc),
            take(1),
          )
        ),
      ).subscribe(([ prev, curr ]) => {
        for (const v of prev) {
          const box = this.pointsToAABB(v.bbox.maxpoint, v.bbox.minpoint)
          const point = this.pointToPoint(v.bbox.center)
          this.annotationIdToFeature.delete(box.id)
          this.annotationIdToFeature.delete(point.id)
          if (!this.voiBBoxSvc) continue
          for (const ann of [box, point]) {
            this.voiBBoxSvc.removeAnnotation({
              id: ann.id
            })
          }
        }
        for (const v of curr) {
          const box = this.pointsToAABB(v.bbox.maxpoint, v.bbox.minpoint)
          const point = this.pointToPoint(v.bbox.center)
          this.annotationIdToFeature.set(box.id, v)
          this.annotationIdToFeature.set(point.id, v)
          if (!this.voiBBoxSvc) {
            throw new Error(`annotation is expected to be added, but annotation layer cannot be instantiated.`)
          }
          for (const ann of [box, point]) {
            this.voiBBoxSvc.updateAnnotation(ann)
          }
        }
        if (this.voiBBoxSvc) this.voiBBoxSvc.setVisible(true)
      })
    )
  }

  private annotationIdToFeature = new Map<string, VoiFeature>()

  private pointsToAABB(pointA: [number, number, number], pointB: [number, number, number]): TNgAnnotationAABBox{
    return {
      id: `${SapiViewsFeaturesVoiQuery.VOI_LAYER_NAME}:${pointA["@id"]}:${pointB["@id"]}`,
      pointA: pointA.map(v => v * 1e6) as [number, number, number],
      pointB: pointB.map(v => v * 1e6) as [number, number, number],
      type: "aabbox"
    }
  }
  private pointToPoint(point: [number, number, number]): TNgAnnotationPoint {
    return {
      id: `${SapiViewsFeaturesVoiQuery.VOI_LAYER_NAME}:${JSON.stringify(point)}}`,
      point: point.map(v => v * 1e6) as [number, number, number],
      type: "point"
    }
  }
}
