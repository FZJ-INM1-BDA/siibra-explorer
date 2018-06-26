import { PipeTransform, Pipe } from "@angular/core";


@Pipe({
  name : 'treeSearch'
})

export class TreeSearchPipe implements PipeTransform{
  public transform(array:any[],filterFn:(item:any)=>boolean,getChildren:(item:any)=>any[]):any[]{
    const transformSingle = (item:any):boolean=>
      filterFn(item) ||
      getChildren(item).some(transformSingle)
    return array.filter(transformSingle)
  }
}