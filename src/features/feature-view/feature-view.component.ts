import { ChangeDetectionStrategy, Component, Inject, Input, OnChanges } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature, TabularFeature, VoiFeature } from 'src/atlasComponents/sapi/sxplrTypes';
import { DARKTHEME } from 'src/util/injectionTokens';

function isTabularData(feature: unknown): feature is TabularFeature<number|string|number[]> {
  return !!feature['index'] && !!feature['columns']
}

function isVoiData(feature: unknown): feature is VoiFeature {
  return !!feature['bbox']
}


type PolarPlotData = {
  receptor: {
    label: string
  }
  density: {
    mean: number
    sd: number
    unit: string
  }
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

  polar$: Observable<PolarPlotData[]> = this.tabular$.pipe(
    filter(v => v?.name.includes("ReceptorDensityFingerprint")),
    map(v => {
      return v.index.map((receptor, idx) => ({
        receptor: {
          label: receptor
        },
        density: {
          mean: v.data[idx][0] as number,
          sd: v.data[idx][1] as number,
          unit: 'fmol/mg'
        }
      }))
    })
  )

  linear$: Observable<Record<number, number>> = this.tabular$.pipe(
    filter(v => v && v.name.includes("ReceptorDensityProfile")),
    map(v => {
      const returnLbl: Record<number, number> = {}

      v.index.forEach((label, idx) => {
        const val = v.data[idx][0]
        if (typeof val === 'number') {
          returnLbl[Math.round(Number(label)*100)] = val
        }
      })
      return returnLbl
    })
  )

  constructor(
    private sapi: SAPI,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>,  
  ) { }

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
