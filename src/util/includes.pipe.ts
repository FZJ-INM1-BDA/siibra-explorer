import { Pipe, PipeTransform } from "@angular/core";

const defaultCompareFn = <T>(item: T, comparator: T): boolean => item === comparator

@Pipe({
  name: 'includes',
})

export class IncludesPipe<T> implements PipeTransform {
  public transform(array: T[], item: T, compareFn: (a: T, b:T) => boolean = defaultCompareFn): boolean {
    if (!array) { return false }
    if (!(array instanceof Array)) { return false }
    return array.some(it => compareFn(it, item))
  }
}
