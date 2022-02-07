import { combineLatest, Observable, BehaviorSubject, Subject, Subscription, of, merge } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, switchMap, tap, startWith, filter } from 'rxjs/operators';
import { Directive, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import { BoundingBoxConcept, SapiVoiResponse } from '../type'
import { SAPI } from '../sapi'
import { environment } from "src/environments/environment"

function validateBbox(input: any): boolean {
  if (!Array.isArray(input)) return false
  if (input.length !== 2) return false
  return input.every(el => Array.isArray(el) && el.length === 3 && el.every(val => typeof val === "number"))
}

@Directive({
  selector: '[sii-xp-spatial-feat-bbox]',
  exportAs: 'siiXpSpatialFeatBbox'
})
export class SpatialFeatureBBox implements OnDestroy{

  static FEATURE_NAME = "VolumeOfInterest"
  private EXPERIMENTAL_FEATURE_FLAG = environment.EXPERIMENTAL_FEATURE_FLAG

  private atlasId$ = new Subject<string>()
  @Input('sii-xp-spatial-feat-bbox-atlas-id')
  set atlasId(val: string) {
    this.atlasId$.next(val)
  }

  private spaceId$ = new Subject<string>()
  @Input('sii-xp-spatial-feat-bbox-space-id')
  set spaceId(val: string) {
    this.spaceId$.next(val)
  }

  public bbox$ = new BehaviorSubject<BoundingBoxConcept>(null)
  @Input('sii-xp-spatial-feat-bbox-bbox-spec')
  set bbox(val: string | BoundingBoxConcept) {
    if (typeof val === "string") {
      try {
        const [min, max] = JSON.parse(val)
        this.bbox$.next([min, max])
      } catch (e) {
        console.warn(`Parse bbox input error`)
      }
      return
    }
    if (!validateBbox(val)) {
      console.warn(`Bbox is not string, and validate error`)
      return
    }
    this.bbox$.next(val)
  }

  @Output('sii-xp-spatial-feat-bbox-features')
  featureOutput = new EventEmitter<SapiVoiResponse[]>()
  features$ = new BehaviorSubject<SapiVoiResponse[]>([])

  @Output('sii-xp-spatial-feat-bbox-busy')
  busy$ = new EventEmitter<boolean>()

  private spatialFeatureSpec$: Observable<{
    atlasId: string
    spaceId: string
    bbox: BoundingBoxConcept
  }> = combineLatest([
    this.atlasId$,
    this.spaceId$,
    this.bbox$,
  ]).pipe(
    map(([ atlasId, spaceId, bbox ]) => ({ atlasId, spaceId, bbox })),
  )

  private subscription: Subscription[] = []

  constructor(private svc: SAPI){
    this.subscription.push(
      this.spatialFeatureSpec$.pipe(
        // experimental feature
        // remove to enable in prod
        filter(() => this.EXPERIMENTAL_FEATURE_FLAG),
        distinctUntilChanged(
          (prev, curr) => prev.atlasId === curr.atlasId
            && prev.spaceId === curr.spaceId
            && JSON.stringify(prev.bbox) === JSON.stringify(curr.bbox)
        ),
        tap(() => {
          this.busy$.emit(true)
          this.featureOutput.emit([])
          this.features$.next([])
        }),
        debounceTime(160),
        switchMap(({
          atlasId,
          spaceId,
          bbox,
        }) => {
          if (!atlasId || !spaceId || !bbox) {
            this.busy$.emit(false)
            return of([])
          }
          const space = this.svc.getSpace(atlasId, spaceId)
          return space.getFeatures(SpatialFeatureBBox.FEATURE_NAME, { bbox: JSON.stringify(bbox) })
        })
      ).subscribe(results => {
        this.featureOutput.emit(results)
        this.features$.next(results)
        this.busy$.emit(false)
      })
    )
  }

  ngOnDestroy(): void {
    while(this.subscription.length) this.subscription.pop().unsubscribe()
  }
}
