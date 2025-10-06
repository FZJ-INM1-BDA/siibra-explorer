import { Pipe, PipeTransform } from "@angular/core";

function isDefined<T>(item: T, _index: number, _array: T[]){
  return !!item
}

@Pipe({
  name: 'filterArray',
  pure: true
})

export class FilterArrayPipe implements PipeTransform{
  public transform<T>(arr: T[], filterFn: (item: T, index?: number, array?: T[]) => boolean = isDefined){
    return (arr || []).filter(filterFn)
  }
}
