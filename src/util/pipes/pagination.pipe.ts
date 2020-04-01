import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'searchResultPagination',
})

export class SearchResultPaginationPipe implements PipeTransform {
  private _hitsPerPage: number = 15
  private _pageNumber: number = 0
  public transform(arr: any[], pageNumber?: number, hitsPerPage?: number) {
    return arr.filter((_, idx) =>
      (idx >= (pageNumber === undefined ? this._pageNumber : pageNumber) * (hitsPerPage === undefined ? this._hitsPerPage : hitsPerPage)) &&
      idx < ((pageNumber === undefined ? this._pageNumber : pageNumber) + 1) * (hitsPerPage === undefined ? this._hitsPerPage : hitsPerPage))
  }
}
