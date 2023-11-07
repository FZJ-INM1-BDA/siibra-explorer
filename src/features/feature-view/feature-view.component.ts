import { ChangeDetectionStrategy, Component, Inject, Input, OnChanges } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature, VoiFeature } from 'src/atlasComponents/sapi/sxplrTypes';
import { DARKTHEME } from 'src/util/injectionTokens';
import { isVoiData, notQuiteRight } from "../guards"


@Component({
  selector: 'sxplr-feature-view',
  templateUrl: './feature-view.component.html',
  styleUrls: ['./feature-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureViewComponent implements OnChanges {

  @Input()
  feature: Feature

  #featureId = new BehaviorSubject<string>(null)

  plotly$ = combineLatest([
    this.#featureId.pipe(
      filter(v => !!v)
    ),
    this.darktheme$
  ]).pipe(
    switchMap(([ featureId, darktheme ]) => this.sapi.getFeaturePlot(featureId, { template: darktheme ? "plotly_dark" : "plotly_white" })),
    shareReplay(1),
    catchError(() => of(null))
  )

  #detailLinks = new Subject<string[]>()
  additionalLinks$ = this.#detailLinks.pipe(
    distinctUntilChanged((o, n) => o.length == n.length),
    map(links => {
      const set = new Set((this.feature.link || []).map(v => v.href))
      return links.filter(l => !set.has(l))
    })
  )

  downloadLink$ = this.sapi.sapiEndpoint$.pipe(
    switchMap(endpoint => this.#featureId.pipe(
      map(featureId => `${endpoint}/feature/${featureId}/download`),
      shareReplay(1)
    ))
  )

  busy$ = new BehaviorSubject<boolean>(false)
  
  voi$ = new BehaviorSubject<VoiFeature>(null)

  warnings$ = new Subject<string[]>()

  constructor(
    private sapi: SAPI,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>,  
  ) { }

  ngOnChanges(): void {
    
    this.voi$.next(null)
    this.busy$.next(true)

    this.#featureId.next(this.feature.id)

    this.sapi.getV3FeatureDetailWithId(this.feature.id).subscribe(
      val => {
        this.busy$.next(false)
        
        if (isVoiData(val)) {
          this.voi$.next(val)
        }

        this.warnings$.next(
          notQuiteRight(val)
        )

        this.#detailLinks.next((val.link || []).map(l => l.href))
        
      },
      () => this.busy$.next(false)
    )
  }
}
