import { PipeTransform, Pipe } from "@angular/core";

@Pipe({
  name : 'copyProperty'
})

export class CopyPropertyPipe implements PipeTransform{
  private isDefined(obj){
    return typeof obj !== 'undefined' && obj !== null
  }
  public transform(inputArray:any[],src:string,dest:string):any[]{
    if(!this.isDefined(inputArray))
      return []
    if(!this.isDefined(src) || !this.isDefined(dest) )
      return this.isDefined(inputArray)
        ? inputArray
        : []

    return inputArray.map(item=>{
      const newObj = Object.assign({},item)
      newObj[dest] = item[src]
      return newObj
    })
  }
}