import { Directive, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SAPI } from 'src/atlasComponents/sapi';
import { SxplrParcellation, SxplrRegion, SxplrTemplate } from 'src/atlasComponents/sapi/sxplrTypes';
import { Feature, CorticalFeature, VoiFeature, TabularFeature } from "src/atlasComponents/sapi/sxplrTypes"

type FeatureMap = {
  "RegionalConnectivity": Feature
  "CorticalProfile": CorticalFeature<number>
  "Tabular": TabularFeature<number|string|number[]>
  "Image": VoiFeature
}

@Directive({
  selector: '[sxplrFeatureFetch]',
  exportAs: "sxplrFeatureFetch"
})
export class FetchDirective<T extends keyof FeatureMap> implements OnChanges {

  /**
   * TODO check if the decorated property survive on inheritence 
   */

  @Input()
  template: SxplrTemplate

  @Input()
  parcellation: SxplrParcellation

  @Input()
  region: SxplrRegion

  @Input()
  featureType: T

  @Output()
  features: BehaviorSubject<FeatureMap[T][]> = new BehaviorSubject([])

  @Output()
  busy$: BehaviorSubject<boolean> = new BehaviorSubject(false)

  constructor(
    private sapi: SAPI
  ) { }

  async ngOnChanges(changes: SimpleChanges) {
    if (!this.featureType) {
      console.warn(`featureType must be defined!`)
    }
    this.busy$.next(true)
    const features = await this.sapi.getV3Features(this.featureType, {
      query: {
        parcellation_id: this.parcellation?.id,
        space_id: this.template?.id,
        region_id: this.region?.name,
      }
    }).toPromise()
    this.busy$.next(false)
    this.features.next(features as any[])
  }
}
