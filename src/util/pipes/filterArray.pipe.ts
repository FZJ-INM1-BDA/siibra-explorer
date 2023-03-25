import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'filterArray',
  pure: true
})

export class FilterArrayPipe implements PipeTransform{
  public transform<T>(arr: T[], filterFn: (item: T, index?: number, array?: T[]) => boolean){
    return (arr || []).filter(filterFn)
  }
}
