import { EventEmitter, Input, Output, SimpleChanges } from "@angular/core"
import { BehaviorSubject, forkJoin, Observable, of } from "rxjs"
import { shareReplay, switchMap, tap } from "rxjs/operators"
import { IHasId } from "src/util/interfaces"
import { IFeature, RegionalFeaturesService } from "../../regionalFeature.service"

export class RegionFeatureBase{

  private _feature: IFeature

  private feature$ = new BehaviorSubject(null)
  @Input()
  set feature(val) {
    this._feature = val
    this.feature$.next(val)
  }
  get feature(){
    return this._feature
  }

  @Input()
  public region: any

  @Output('feature-explorer-is-loading')
  public dataIsLoadingEventEmitter: EventEmitter<boolean> = new EventEmitter()

  public features: IFeature[] = []
  public data$: Observable<IHasId[]>

  /**
   * using isLoading flag for conditional rendering of root element (or display loading spinner)
   * this is necessary, or the transcluded tab will always be the active tab,
   * as this.features as populated via async
   */
  public isLoading$ = new BehaviorSubject(false)
  private _isLoading: boolean = false
  get isLoading(){
    return this._isLoading
  }
  set isLoading(val){
    if (val !== this._isLoading)
      this._isLoading = val
    this.isLoading$.next(val)
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

  ngOnChanges(changes: SimpleChanges){
    if (changes.region && changes.region.previousValue !== changes.region.currentValue) {
      this.isLoading = true
      this.features = []
      
      const _ = (changes.region.currentValue
        ? this._regionalFeatureService.getAllFeaturesByRegion(changes.region.currentValue)
        : of([])
      ).pipe(

      ).subscribe({
        next: features => this.features = features,
        complete: () => this.isLoading = false
      })
    }
  }

  constructor(
    private _regionalFeatureService: RegionalFeaturesService
  ){

    /**
    * once feature stops loading, watch for input feature
    */
    this.data$ = this.feature$.pipe(
      tap(() => this.dataIsLoading = true),
      switchMap((feature: IFeature) => forkJoin(
        feature.data.map(datum => this._regionalFeatureService.getFeatureData(this.region, feature, datum)))
      ),
      tap(() => this.dataIsLoading = false),
      shareReplay(1),
    )
  }
}
