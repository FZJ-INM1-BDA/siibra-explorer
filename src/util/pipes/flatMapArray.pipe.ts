import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'flatmapArrayPipe'
})

export class FlatmapArrayPipe implements PipeTransform{
  public transform(aoa: any[][]){
    return aoa.reduce((acc, array) => acc.concat(array), [])
  }
}