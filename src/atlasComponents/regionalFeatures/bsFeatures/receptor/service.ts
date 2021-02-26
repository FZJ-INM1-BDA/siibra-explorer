import { Injectable } from "@angular/core";
import { TRegion } from "../constants";
import { BsFeatureService } from "../service";
import { TBSResp } from "./type";

@Injectable()
export class BsFeatureReceptorService{

  public getFeatureFromRegion(region: TRegion) {
    return this.bsFeatureService.getFeature<TBSResp>('ReceptorDistribution', region)
  }
  constructor(
    private bsFeatureService: BsFeatureService
  ){

  }
}
