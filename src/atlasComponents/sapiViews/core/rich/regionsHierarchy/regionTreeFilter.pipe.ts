import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'regionTreeFilter',
  pure: true
})

export class RegionTreeFilterPipe implements PipeTransform {
  public transform<T>(array: T[], filterFn: (item: T) => boolean, getChildren: (item: T) => T[]): T[] {
    const transformSingle = (item: T): boolean =>
      filterFn(item) || (getChildren(item) || []).some(transformSingle)
      
    return array
      ? array.filter(transformSingle)
      : []
  }
}
