import { Pipe, PipeTransform } from "@angular/core";


@Pipe({
  name : 'getNames'
})

export class GetNamesPipe implements PipeTransform{

  public transform(array:any[]):string[]{
    return array ? 
      array.map(item=>item.name ? item.name : 'Untitled') : 
      []
  }
}