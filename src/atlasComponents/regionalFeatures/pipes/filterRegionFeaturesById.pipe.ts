import { Pipe, PipeTransform } from "@angular/core";
import { IFeature } from "../regionalFeature.service";
import { getIdFromFullId } from 'common/util'
@Pipe({
  name: 'filterRegionFeaturesById',
  pure: true
})

export class FilterRegionFeaturesById implements PipeTransform{
  public transform(features: IFeature[], id: string){
    const filterId = getIdFromFullId(id)
    return features.filter(f => getIdFromFullId(f['@id']) === filterId)
  }
}
