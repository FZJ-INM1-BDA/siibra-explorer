import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { BehaviorSubject, forkJoin, Observable, Subject, Subscription } from "rxjs";
import { filter, shareReplay, switchMap, switchMapTo, tap } from "rxjs/operators";
import { IHasId } from "src/util/interfaces";
import { IFeature, RegionalFeaturesService } from "../regionalFeature.service";
import { RegionFeatureBase } from "../regionFeature.base";

const selectedColor = [ 255, 0, 0 ]

@Component({
  selector: 'feature-explorer',
  templateUrl: './featureExplorer.template.html',
  styleUrls: [
    './featureExplorer.style.css'
  ]
})

export class FeatureExplorer extends RegionFeatureBase implements OnChanges, OnInit, OnDestroy{

  private landmarksLoaded: IHasId[] = []
  private onDestroyCb: Function[] = []
  private sub: Subscription[] = []
  private _feature: IFeature

  private feature$ = new BehaviorSubject(null)
  @Input()
  set feature(val) {
    this._feature = val
    this.feature$.next(val)
  }

  public data$: Observable<IHasId[]>

  constructor(
    private regionFeatureService: RegionalFeaturesService,
  ){
    super(regionFeatureService)
    /**
    * once feature stops loading, watch for input feature
    */
    this.data$ = this.isLoading$.pipe(
      filter(v => !v),
      tap(() => this.dataIsLoading = true),
      switchMapTo(this.feature$),
      switchMap((feature: IFeature) => forkJoin(
        feature.data.map(datum => this.regionFeatureService.getFeatureData(this.region, feature, datum)))
      ),
      tap(() => this.dataIsLoading = false),
      shareReplay(1),
    )
  }

  ngOnInit(){
    this.sub.push(
      this.data$.subscribe(data => {
        const landmarksTobeLoaded: IHasId[] = []
        
        for (const datum of data) {
          const electrodeId = datum['@id']
          landmarksTobeLoaded.push(
            ...datum['contactPoints'].map(({ ['@id']: contactPtId, position }) => {
              return {
                _: {
                  electrodeId,
                  contactPtId
                },
                ['@id']: `${electrodeId}#${contactPtId}`,
                position
              }
            })
          )
        }
        /**
         * remove first, then add
         */
        if (this.landmarksLoaded.length > 0) this.regionFeatureService.removeLandmarks(this.landmarksLoaded)
        if (landmarksTobeLoaded.length > 0) this.regionFeatureService.addLandmarks(landmarksTobeLoaded)
        this.landmarksLoaded = landmarksTobeLoaded
      })
    )

    this.onDestroyCb.push(() => {
      if (this.landmarksLoaded.length > 0) this.regionFeatureService.removeLandmarks(this.landmarksLoaded)
    })
  }

  public dataIsLoading$ = new BehaviorSubject(false)
  private _dataIsLoading = false
  set dataIsLoading(val) {
    if (val === this._dataIsLoading) return
    this._dataIsLoading = val
    this.dataIsLoading$.next(val)
  }
  get dataIsLoading(){
    return this._dataIsLoading
  }

  ngOnChanges(changes: SimpleChanges){
    super.ngOnChanges(changes)
  }

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
    while(this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  handleDatumExpansion(electrodeId: string, open: boolean){
    /**
     * TODO either debounce call here, or later down stream
     */
    if (this.landmarksLoaded.length > 0) this.regionFeatureService.removeLandmarks(this.landmarksLoaded)
    if (this.landmarksLoaded.length > 0) {
      this.regionFeatureService.addLandmarks(this.landmarksLoaded.map(lm => {
        if (lm['_']['electrodeId'] === electrodeId) {
          return {
            ...lm,
            color: open ? selectedColor : null,
            showInSliceView: open
          }
        } else {
          return lm
        }
      }))
    }
  }

  public exploreElectrode$ = new Subject()

  handleLandmarkClick(arg: { landmark: any, next: Function }) {
    const { landmark, next } = arg

    /**
     * there may be other custom landmarks
     * so check if the landmark clicked is one that's managed by this cmp
     */
    const isOne = this.landmarksLoaded.some(lm => {
      return lm['_']['electrodeId'] === landmark['_']['electrodeId']
    })

    if (isOne) {
      this.exploreElectrode$.next(landmark)
    } else {
      next()
    }
  }
}