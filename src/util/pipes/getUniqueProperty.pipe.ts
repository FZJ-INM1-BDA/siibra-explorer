import { Pipe, PipeTransform } from "@angular/core";


@Pipe({
  name : 'getUniqueProperty'
})

export class GetUniqueProperty implements PipeTransform{
  public transform(arr:any[],prop:string):string[]{
    return [...arr.reduce((acc:Set<string>,curr)=>{
      return curr[prop] && typeof curr[prop] === 'string' ? 
        acc.has(curr[prop]) ?
          acc :
          acc.add(curr[prop]) :
        acc
    },new Set())]
  }
}