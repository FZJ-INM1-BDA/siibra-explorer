import { Pipe, PipeTransform } from "@angular/core";

const defaultCompareFn = (item: any, comparator: any): boolean => item === comparator

@Pipe({
  name: 'includes',
})

export class IncludesPipe implements PipeTransform {
  public transform(array: any[], item: any, compareFn= defaultCompareFn): boolean {
    if (!array) { return false }
    if (!(array instanceof Array)) { return false }
    return array.some(it => compareFn(it, item))
  }
}
