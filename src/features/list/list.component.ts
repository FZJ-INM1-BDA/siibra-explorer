import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import { FeatureType } from 'src/atlasComponents/sapi/typeV3';
import { AllFeatures, FeatureBase } from '../base';

@Component({
  selector: 'sxplr-feature-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  exportAs: "featureList"
})
export class ListComponent extends FeatureBase {

  @Output()
  onClickFeature = new EventEmitter<Feature>()

  @Input()
  featureRoute: string
  private guardedRoute$ = new BehaviorSubject<FeatureType>(null)

  public state$ = new BehaviorSubject<'busy'|'noresult'|'result'>('noresult')

  constructor(private sapi: SAPI) {
    super()
  }

  ngOnChanges(sc: SimpleChanges): void {
    super.ngOnChanges(sc)
    const { featureRoute } = sc
    if (featureRoute) {
      const featureType = (featureRoute.currentValue || '').split("/").slice(-1)[0]
      this.guardedRoute$.next(AllFeatures[featureType])
    }
  }

  public features$: Observable<Feature[]> = combineLatest([
    this.guardedRoute$,
    this.TPRBbox$,
  ]).pipe(
    tap(() => this.state$.next('busy')),
    switchMap(([route, { template, parcellation, region, bbox }]) => {
      if (!route) {
        return throwError("noresult")
      }
      const query = {}
      if (template) query['space_id'] = template.id
      if (parcellation) query['parcellation_id'] = parcellation.id
      if (region) query['region_id'] = region.name
      if (bbox) query['bbox'] = JSON.stringify(bbox)
      return this.sapi.getV3Features(route, {
        query: {
          ...this.queryParams,
          ...query,
        } as any
      })
    }),
    catchError(() => {
      this.state$.next("noresult")
      return of([] as Feature[])
    }),
    tap(result => this.state$.next(result.length > 0 ? 'result' : 'noresult')),
  )

  onClickItem(feature: Feature){
    this.onClickFeature.emit(feature)
  }
}
