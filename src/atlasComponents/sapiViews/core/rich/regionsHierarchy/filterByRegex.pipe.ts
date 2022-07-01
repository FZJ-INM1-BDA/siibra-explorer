import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'filterByRegex',
  pure: true,
})

export class FilterByRegexPipe implements PipeTransform {
  public transform(searchFields: string[], searchTerm: string) {
    try {
      return searchFields.some(searchField => new RegExp(searchTerm, 'i').test(searchField))
    } catch (e) {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
      // CC0 or MIT
      return searchFields.some(searchField => new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(searchField))
    }
  }
}
