import { BehaviorSubject, throwError } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { TRegion, IBSSummaryResponse, IBSDetailResponse } from "./type";
import { BsFeatureService, TFeatureCmpInput } from "./service";
import { flattenReducer } from 'common/util'
import { Input } from "@angular/core";

export class BsRegionInputBase{

  protected region$ = new BehaviorSubject<TRegion>(null)
  private _region: TRegion

  @Input()
  set region(val: TRegion) {
    this._region = val
    this.region$.next(val)
  }

  get region() {
    return this._region
  }

  constructor(
    private svc: BsFeatureService,
    data?: TFeatureCmpInput
  ){
    if (data) {
      this.region = data.region
    }
  }

  protected featuresList$ = this.region$.pipe(
    switchMap(region => this.svc.listFeatures(region)),
    map(result => result.features.map(obj => Object.keys(obj).reduce(flattenReducer, [])))
  )

  protected getFeatureInstancesList<T extends keyof IBSSummaryResponse>(feature: T){
    if (!this._region) return throwError('#getFeatureInstancesList region needs to be defined')
    return this.svc.getFeatures<T>(feature, this._region)
  }

  protected getFeatureInstance<T extends keyof IBSDetailResponse>(feature: T, id: string) {
    if (!this._region) return throwError('#getFeatureInstance region needs to be defined')
    return this.svc.getFeature<T>(feature, this._region, id)
  }
}
