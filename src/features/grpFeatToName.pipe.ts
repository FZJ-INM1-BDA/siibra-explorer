import { Pipe, PipeTransform } from "@angular/core";

interface MetaDisplayName {
  meta: {
    displayName: string
  }
}

@Pipe({
  name: 'grpFeatToName',
  pure: true
})

export class GroupFeaturesToName implements PipeTransform{
  public transform(groupFeats: MetaDisplayName[]): string[] {
    return groupFeats.map(f => f.meta.displayName)
  }
}
