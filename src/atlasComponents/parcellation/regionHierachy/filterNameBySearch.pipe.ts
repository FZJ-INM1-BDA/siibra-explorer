import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'filterNameBySearch',
})

export class FilterNameBySearch implements PipeTransform {
  public transform(searchFields: string[], searchTerm: string) {
    try {
      return searchFields.some(searchField => new RegExp(searchTerm, 'i').test(searchField))
    } catch (e) {
      /* https://stackoverflow.com/a/9310752/6059235 */
      return searchFields.some(searchField => new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).test(searchField))
    }
  }
}
