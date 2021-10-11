import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'filterNameBySearch',
})

export class FilterNameBySearch implements PipeTransform {
  public transform(searchFields: string[], searchTerm: string) {
    try {
      return searchFields.some(searchField => new RegExp(searchTerm, 'i').test(searchField))
    } catch (e) {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
      // CC0 or MIT
      return searchFields.some(searchField => new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(searchField))
    }
  }
}
