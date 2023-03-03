import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature, TabularFeature, VoiFeature } from 'src/atlasComponents/sapi/sxplrTypes';

function isTabularData(feature: unknown): feature is TabularFeature<number|string|number[]> {
  return !!feature['index'] && !!feature['columns']
}

function isVoiData(feature: unknown): feature is VoiFeature {
  return !!feature['bbox']
}

@Component({
  selector: 'sxplr-feature-view',
  templateUrl: './feature-view.component.html',
  styleUrls: ['./feature-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureViewComponent implements OnChanges {

  @Input()
  feature: Feature

  busy$ = new BehaviorSubject<boolean>(false)
  
  tabular$ = new BehaviorSubject<TabularFeature<number|string|number[]>>(null)
  voi$ = new BehaviorSubject<VoiFeature>(null)
  columns$: Observable<string[]> = this.tabular$.pipe(
    map(data => data
      ? ['index', ...data.columns]
      : []),
  )
  constructor(private sapi: SAPI) { }

  ngOnChanges(): void {
    
    this.voi$.next(null)
    this.tabular$.next(null)
    this.busy$.next(true)

    this.sapi.getV3FeatureDetailWithId(this.feature.id).subscribe(
      val => {
        this.busy$.next(false)
        
        if (isTabularData(val)) {
          this.tabular$.next(val)
        }
        if (isVoiData(val)) {
          this.voi$.next(val)
        }
      },
      () => this.busy$.next(false)
    )
  }
}
