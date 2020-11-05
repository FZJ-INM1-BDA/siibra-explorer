import { Pipe, PipeTransform } from "@angular/core";
import { IFeature } from "../regionalFeature.service";

@Pipe({
  name: 'findRegionFeaturebyId',
  pure: true
})

export class FindRegionFEatureById implements PipeTransform{
  public transform(features: IFeature[], id: string){
    return features.find(f => f['@id'] === id)
  }
}
