import { PipeTransform, Pipe } from "@angular/core";

@Pipe({
  name : 'copyProperty'
})

export class CopyPropertyPipe implements PipeTransform{
  public transform(inputArray:any[],src:string,dest:string):any[]{
    if(!inputArray)
      return []
    return inputArray.map(item=>{
      const newObj = Object.assign({},item)
      newObj[dest] = item[src]
      return newObj
    })
  }
}