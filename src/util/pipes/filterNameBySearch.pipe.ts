import { Pipe, PipeTransform } from "@angular/core";


@Pipe({
  name : 'filterNameBySearch'
})

export class FilterNameBySearch implements PipeTransform{
  public transform(searchFields:string[],searchTerm:string){
    return searchFields.some(searchField=> new RegExp(searchTerm,'i').test(searchField))
  }
}