import { Pipe, PipeTransform } from "@angular/core";

/**
 * nb, will return undefined elements
 * nb, will throw error if one of the input element is not an object
 */

@Pipe({
  name : 'getPropMapPipe'
})

export class GetPropMapPipe implements PipeTransform{
  public transform(arr:any[],prop:string):any[]{
    return arr.map(item => item[prop])
  }
}