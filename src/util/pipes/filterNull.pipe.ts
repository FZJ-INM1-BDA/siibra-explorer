import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'filterNull',
})

export class FilterNullPipe implements PipeTransform {
  public transform(arr: any[], fn?: (item: any) => boolean) {
    return (arr && arr.filter(obj => fn ? fn(obj) : obj !== null)) || []
  }
}
