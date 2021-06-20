import { Injectable } from "@angular/core";
import { TRegion } from "../constants";
import { BsFeatureService } from "../service";

@Injectable()
export class BsFeatureReceptorService{

  public getReceptorRegionalFeature(region: TRegion) {
    return this.bsFeatureService.getFeatures('ReceptorDistribution', region)
  }
  public getReceptorRegionalFeatureDetail(region: TRegion, id: string) {
    return this.bsFeatureService.getFeature('ReceptorDistribution', region, id)
  }
  constructor(
    private bsFeatureService: BsFeatureService
  ){

  }
}
