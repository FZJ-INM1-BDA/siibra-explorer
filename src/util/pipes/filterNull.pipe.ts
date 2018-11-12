import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'filterNull'
})

export class FilterNullPipe implements PipeTransform{
  public transform(arr:any[]){
    return arr.filter(obj => obj !== null)
  }
}