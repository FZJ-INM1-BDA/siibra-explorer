import { Component, EventEmitter, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { RegionalFeaturesService } from "src/ui/regionalFeatures/regionalFeature.service";
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

  private subs: Subscription[] = []

  constructor(
    regService: RegionalFeaturesService
  ){
    super(regService)
  }

  public selectedReceptor: string

  ngOnDestroy(){
    while(this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}
