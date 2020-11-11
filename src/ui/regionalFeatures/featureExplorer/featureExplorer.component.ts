import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { BehaviorSubject, forkJoin, merge, Observable, Subject, Subscription } from "rxjs";
import { debounceTime, map, scan, shareReplay, switchMap, tap } from "rxjs/operators";
import { IHasId } from "src/util/interfaces";
import { IFeature, RegionalFeaturesService } from "../regionalFeature.service";

const selectedColor = [ 255, 0, 0 ]

@Component({
  selector: 'feature-explorer',
  templateUrl: './featureExplorer.template.html',
  styleUrls: [
    './featureExplorer.style.css'
  ]
})

export class FeatureExplorer implements OnInit, OnDestroy{

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

  @Input()
  private region: any

  public data$: Observable<IHasId[]>

  @Output('feature-explorer-is-loading')
  public dataIsLoadingEventEmitter: EventEmitter<boolean> = new EventEmitter()

  constructor(
    private regionFeatureService: RegionalFeaturesService,
  ){
    /**
    * once feature stops loading, watch for input feature
    */
    this.data$ = this.feature$.pipe(
      tap(() => this.dataIsLoading = true),
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

    this.sub.push(
      this.openElectrodeId$.pipe(
        debounceTime(200)
      ).subscribe(arr => {

        if (this.landmarksLoaded.length > 0) {
          this.regionFeatureService.removeLandmarks(this.landmarksLoaded)
          this.regionFeatureService.addLandmarks(this.landmarksLoaded.map(lm => {
            const selected = arr.some(id => id === lm['_']['electrodeId'])
            return {
              ...lm,
              color: selected ? selectedColor : null,
              showInSliceView: selected
            }
          }))
        }
      })
    )
  }

  public dataIsLoading$ = new BehaviorSubject(false)
  private _dataIsLoading = false
  set dataIsLoading(val) {
    if (val === this._dataIsLoading) return
    this._dataIsLoading = val
    this.dataIsLoading$.next(val)
    this.dataIsLoadingEventEmitter.next(val)
  }
  get dataIsLoading(){
    return this._dataIsLoading
  }

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
    while(this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  handleDatumExpansion(electrodeId: string, open: boolean){
    /**
     * TODO either debounce call here, or later down stream
     */
    if (open) this.exploreElectrode$.next(electrodeId)
    else this.unExploreElectrode$.next(electrodeId)
  }

  private unExploreElectrode$ = new Subject<string>()
  private exploreElectrode$ = new Subject<string>()
  public openElectrodeId$ = merge(
    this.unExploreElectrode$.pipe(
      map(id => ({
        add: null,
        remove: id
      }))
    ),
    this.exploreElectrode$.pipe(
      map(id => ({
        add: id,
        remove: null
      }))
    )
  ).pipe(
    scan((acc, curr) => {
      const { add, remove } = curr
      const set = new Set(acc)
      if (add) set.add(add)
      if (remove) set.delete(remove)
      return Array.from(set)
    }, [])
  )

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
      this.exploreElectrode$.next(landmark['_']['electrodeId'])
    } else {
      next()
    }
  }
}
