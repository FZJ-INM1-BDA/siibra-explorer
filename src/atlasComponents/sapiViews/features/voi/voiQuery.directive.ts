import { Directive, EventEmitter, Inject, Input, OnChanges, OnDestroy, Optional, Output } from "@angular/core";
import { merge, Observable, of, Subject, Subscription } from "rxjs";
import { debounceTime, pairwise, shareReplay, startWith, switchMap, tap } from "rxjs/operators";
import { AnnotationLayer, TNgAnnotationPoint, TNgAnnotationAABBox } from "src/atlasComponents/annotations";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { BoundingBoxConcept, SapiAtlasModel, SapiSpaceModel, SapiVOIDataResponse, OpenMINDSCoordinatePoint } from "src/atlasComponents/sapi/type";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";

@Directive({
  selector: '[sxplr-sapiviews-features-voi-query]',
  exportAs: 'sxplrSapiViewsFeaturesVoiQuery'
})

export class SapiViewsFeaturesVoiQuery implements OnChanges, OnDestroy{

  static VOI_LAYER_NAME = 'voi-annotation-layer'
  static VOI_ANNOTATION_COLOR = "#ffff00"
  private voiQuerySpec = new Subject<{
    atlas: SapiAtlasModel
    space: SapiSpaceModel
    bbox: BoundingBoxConcept
  }>()

  private canFetchVoi(){
    return !!this.atlas && !!this.space && !!this.bbox
  }
  
  @Input('sxplr-sapiviews-features-voi-query-atlas')
  atlas: SapiAtlasModel

  @Input('sxplr-sapiviews-features-voi-query-space')
  space: SapiSpaceModel

  @Input('sxplr-sapiviews-features-voi-query-bbox')
  bbox: BoundingBoxConcept

  @Output('sxplr-sapiviews-features-voi-query-onhover')
  onhover = new EventEmitter<SapiVOIDataResponse>()

  @Output('sxplr-sapiviews-features-voi-query-onclick')
  onclick = new EventEmitter<SapiVOIDataResponse>()

  public busy$ = new EventEmitter<boolean>()
  public features$: Observable<SapiVOIDataResponse[]> = this.voiQuerySpec.pipe(
    debounceTime(160),
    tap(() => this.busy$.emit(true)),
    switchMap(({ atlas, bbox, space }) => {
      if (!this.canFetchVoi()) {
        return of([])
      }
      return merge(
        of([]),
        this.sapi.getSpace(atlas["@id"], space["@id"]).getFeatures({ bbox: JSON.stringify(bbox) }).pipe(
          tap(val => {
            this.busy$.emit(false)
          })
        )
      )
    }),
    startWith([]),
    shareReplay(1)
  )

  private hoveredFeat: SapiVOIDataResponse
  private onDestroyCb: (() => void)[] = []
  private subscription: Subscription[] = []
  ngOnChanges(): void {
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
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  handleOnHoverFeature(id: string){
    const ann = this.annotationIdToFeature.get(id)
    this.hoveredFeat = ann
    this.onhover.emit(ann)
  }

  private _voiBBoxSvc: AnnotationLayer
  get voiBBoxSvc(): AnnotationLayer {
    if (this._voiBBoxSvc) return this._voiBBoxSvc
    try {
      const layer = AnnotationLayer.Get(
        SapiViewsFeaturesVoiQuery.VOI_LAYER_NAME,
        SapiViewsFeaturesVoiQuery.VOI_ANNOTATION_COLOR
      )
      this._voiBBoxSvc = layer
      this.subscription.push(
        layer.onHover.subscribe(val => this.handleOnHoverFeature(val?.id))
      )
      return layer
    } catch (e) {
      return null
    }
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
        startWith([] as SapiVOIDataResponse[]),
        pairwise()
      ).subscribe(([ prev, curr ]) => {
        for (const v of prev) {
          const box = this.pointsToAABB(v.location.maxpoint, v.location.minpoint)
          const point = this.pointToPoint(v.location.center)
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
          const box = this.pointsToAABB(v.location.maxpoint, v.location.minpoint)
          const point = this.pointToPoint(v.location.center)
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

  private annotationIdToFeature = new Map<string, SapiVOIDataResponse>()

  private pointsToAABB(pointA: OpenMINDSCoordinatePoint, pointB: OpenMINDSCoordinatePoint): TNgAnnotationAABBox{
    return {
      id: `${SapiViewsFeaturesVoiQuery.VOI_LAYER_NAME}:${pointA["@id"]}:${pointB["@id"]}`,
      pointA: pointA.coordinates.map(v => v.value * 1e6) as [number, number, number],
      pointB: pointB.coordinates.map(v => v.value * 1e6) as [number, number, number],
      type: "aabbox"
    }
  }
  private pointToPoint(point: OpenMINDSCoordinatePoint): TNgAnnotationPoint {
    return {
      id: `${SapiViewsFeaturesVoiQuery.VOI_LAYER_NAME}:${point["@id"]}`,
      point: point.coordinates.map(v => v.value * 1e6) as [number, number, number],
      type: "point"
    }
  }
}
