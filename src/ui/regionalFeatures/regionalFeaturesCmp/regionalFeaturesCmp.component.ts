import { Component, OnChanges, SimpleChanges } from "@angular/core";
import { RegionalFeaturesService } from "../regionalFeature.service";
import { RegionFeatureBase } from "../regionFeature.base";

@Component({
  selector: 'regional-features',
  templateUrl: './regionalFeaturesCmp.template.html',
  styleUrls: [
    './regionalFeaturesCmp.style.css'
  ],
})

export class RegionalFeaturesCmp extends RegionFeatureBase implements OnChanges{

  ngOnChanges(changes: SimpleChanges){
    super.ngOnChanges(changes)
  }

  constructor(
    regionalFeatureService: RegionalFeaturesService
  ){
    super(regionalFeatureService)
  }

  public showingRegionFeatureId: string
  public showingRegionFeatureIsLoading = false

}
