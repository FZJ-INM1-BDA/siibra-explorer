import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'mapToProperty',
  pure: true
})

export class MapToPropertyPipe implements PipeTransform{
  public transform(arr: any[], prop: string){
    return arr.map(item => prop ? item[prop] : item)
  }
}
