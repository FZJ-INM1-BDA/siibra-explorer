import { Pipe, PipeTransform } from "@angular/core";
import { GroupedFeature } from "./category-acc.directive";

@Pipe({
  name: 'grpFeatToName',
  pure: true
})

export class GroupFeaturesToName implements PipeTransform{
  public transform(groupFeats: GroupedFeature[]): string[] {
    return groupFeats.map(f => f.meta.displayName)
  }
}
