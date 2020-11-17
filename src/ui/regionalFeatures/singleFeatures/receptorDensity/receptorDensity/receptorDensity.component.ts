import { Component, EventEmitter, OnDestroy, Optional } from "@angular/core";
import { Observable, of, Subscription } from "rxjs";
import { RegionalFeaturesService } from "src/ui/regionalFeatures/regionalFeature.service";
import { PureContantService } from "src/util";
import { RegionFeatureBase } from "../../base/regionFeature.base";
import { ISingleFeature } from "../../interfaces";

@Component({
  templateUrl: './receptorDensity.template.html',
  styleUrls: [
    './receptorDensity.style.css'
  ]
})

export class ReceptorDensityFeatureCmp extends RegionFeatureBase implements ISingleFeature, OnDestroy{
  public DS_PREVIEW_URL = DATASET_PREVIEW_URL
  viewChanged: EventEmitter<null> = new EventEmitter()

  public darktheme$: Observable<boolean>

  private subs: Subscription[] = []
  public depScriptLoaded$: Observable<boolean>
  constructor(
    regService: RegionalFeaturesService,
    @Optional() pureConstantService: PureContantService
  ){
    super(regService)
    this.depScriptLoaded$ = regService.depScriptLoaded$
    if (pureConstantService) {
      this.darktheme$ = pureConstantService.darktheme$
    } else {
      this.darktheme$ = of(false)
    }
  }

  public selectedReceptor: string

  ngOnDestroy(){
    while(this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}
