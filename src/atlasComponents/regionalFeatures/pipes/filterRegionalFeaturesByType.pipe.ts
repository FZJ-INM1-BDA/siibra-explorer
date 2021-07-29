import { Pipe, PipeTransform } from "@angular/core";
import { IFeature } from "../regionalFeature.service";

@Pipe({
  name: 'filterRegionalFeaturesBytype',
  pure: true,
})

export class FilterRegionalFeaturesByTypePipe implements PipeTransform{
  public transform(array: IFeature[], featureType: string){
    return array.filter(f => featureType ? f.type === featureType : true )
  }
}
