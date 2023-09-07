import { Pipe, PipeTransform } from "@angular/core";

interface MetaHasTotal {
  meta: {
    total: number
  }
}

@Pipe({
  name: 'grpFeatTally',
  pure: true
})

export class GroupFeatureTallyPipe implements PipeTransform{
  public transform(groupFeats: MetaHasTotal[]): number {
    return groupFeats.map(f => f.meta.total).reduce((v, acc) => v + acc, 0)
  }
}
